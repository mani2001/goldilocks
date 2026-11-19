import { Type } from 'typebox';
import { createAgentSession, DefaultResourceLoader, getAgentDir, ModelRuntime, SessionManager, SettingsManager, type ExtensionAPI, type ExtensionContext } from '@earendil-works/pi-coding-agent';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CACHE_DIR, TF_BASE, readJSON, refreshCatalog, extractAA } from '../src/evidence.mjs';
import { chatCandidates, NoSelection, TEACHER } from '../src/router.mjs';
import { routeTask, decisionLog } from '../src/service.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = 'goldilocks-selection';
const TOOL_NAMES = ['read', 'grep', 'find', 'ls', 'bash', 'edit', 'write'];

export default async function (pi: ExtensionAPI) {
  // Explicitly loaded package config only, not arbitrary working-directory code.
  try { process.loadEnvFile(join(ROOT, '.env')); } catch (e: any) { if (e.code !== 'ENOENT') throw e; }
  const config = { quality: 3, cost: 3, teacherTimeoutMs: 60000, maxEvidenceChars: 180000, maxEvidencePages: 6, capture: false, allowedModels: null,
    ...(await readJSON(join(ROOT, 'goldilocks.config.json')) || {}) };
  let done = false;
  let providerConfig: any;
  let lastDecision: any;
  let childRunning = false;

  function notice(ctx: ExtensionContext, message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (ctx.hasUI) ctx.ui.notify(message, level);
    else process.stderr.write(`[Goldilocks] ${message}\n`);
  }
  function register(catalog: any) {
    const candidates = chatCandidates(catalog).filter(m => m.context_length !== null);
    providerConfig = {
      name: 'Nebius Token Factory', baseUrl: TF_BASE, api: 'openai-completions', apiKey: '$NEBIUS_API_KEY',
      models: candidates.map(m => ({ type: 'chat', id: m.id, name: m.name, reasoning: m.reasoning, input: m.modalities,
        cost: { input: m.cost_in_per_1m ?? 0, output: m.cost_out_per_1m ?? 0, cacheRead: m.cache_read_per_1m ?? 0, cacheWrite: 0 },
        contextWindow: m.context_length, maxTokens: Math.min(8192, m.context_length),
        compat: { supportsDeveloperRole: false, supportsReasoningEffort: false },
      })),
    };
    pi.registerProvider('tokenfactory', providerConfig);
  }
  // Registration remains local/offline at load time. Refresh on the first task.
  const initial = await readJSON(join(CACHE_DIR, 'catalog.json'));
  if (initial) register(initial);

  const callTeacher = (ctx: ExtensionContext) => async ({ systemPrompt, prompt, signal }: any) => {
    const model = ctx.modelRegistry.find(TEACHER.provider, TEACHER.id);
    if (!model) throw new Error('GPT-6.1 Sol is missing from Pi’s Codex catalogue');
    const response = await ctx.modelRegistry.streamSimple(model, {
      systemPrompt, messages: [{ role: 'user', content: prompt, timestamp: Date.now() }],
      // No tools, history, repository instructions or execution-model system prompt.
    }, { reasoning: 'high', maxTokens: 8192, signal }).result();
    if (response.stopReason === 'error' || response.stopReason === 'aborted') throw new Error('Teacher request failed');
    return response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
  };
  async function select(task: string, kind: string, ctx: ExtensionContext, requirements: any = {}, signal?: AbortSignal) {
    const result = await routeTask({ task, kind, preferences: config,
      requirements: { allowedModels: config.allowedModels, ...requirements },
      callTeacher: callTeacher(ctx), dir: CACHE_DIR, signal, capture: config.capture,
      timeoutMs: config.teacherTimeoutMs, maxEvidenceChars: config.maxEvidenceChars, maxEvidencePages: config.maxEvidencePages,
      notify: (s: string) => notice(ctx, s, 'warning'),
    });
    // Refresh the runtime provider list to the exact catalogue used for selection.
    register(await readJSON(join(CACHE_DIR, 'catalog.json')));
    lastDecision = result;
    return result;
  }
  function display(ctx: ExtensionContext, decision: any) {
    const p = decision.pick;
    const price = (n: number | null) => n === null ? 'unknown' : `$${n.toFixed(3)}`;
    notice(ctx, `${p.name} · Token Factory · ${price(p.cost_in_per_1m)} in / ${price(p.cost_out_per_1m)} out per 1M tokens · latency unknown\nAlternatives: ${decision.alternatives.map((a: any) => a.name).join(', ') || 'none'} · confidence not yet calibrated`);
    if (ctx.hasUI) ctx.ui.setStatus('goldilocks', `Goldilocks: ${p.name}`);
  }
  async function logApplied(ctx: ExtensionContext, kind: string, status: string, model?: any) {
    try {
      await decisionLog(CACHE_DIR, { at: new Date().toISOString(), kind, status,
        model: model?.id, provider: model?.provider, teacher: TEACHER });
    } catch { notice(ctx, 'Goldilocks decision log could not be written', 'warning'); }
  }
  function priorContext(ctx: ExtensionContext) {
    const entries: any[] = ctx.sessionManager.getBranch();
    const saved = entries.filter(e => e.type === 'custom' && e.customType === ENTRY).at(-1)?.data;
    const hasMessages = entries.some(e => e.type === 'message' && (e.message?.role === 'user' || e.message?.role === 'assistant'));
    return { saved, hasMessages };
  }
  pi.on('session_start', (_event, ctx) => {
    const { saved, hasMessages } = priorContext(ctx);
    done = !!saved || hasMessages;
    if (saved?.model && ctx.hasUI) ctx.ui.setStatus('goldilocks', `Goldilocks: ${saved.model}`);
    notice(ctx, done ? 'Existing conversation: keeping its current model.' : 'Ready: first task will route through Sol high using AA evidence.');
  });
  pi.on('input', async (event, ctx) => {
    // SDK hosts may reload without emitting session_start. Persisted state is
    // authoritative; never route an existing conversation from a later prompt.
    if (!done) {
      const { saved, hasMessages } = priorContext(ctx);
      done = !!saved || hasMessages;
    }
    // Registered commands are handled before this event. Skill/template inputs
    // still count as the opening task; skipping them could route a later turn.
    if (done || event.streamingBehavior || !event.text.trim()) return { action: 'continue' };
    done = true; // One attempt per conversation, including a native fallback.
    try {
      const systemTokens = Math.ceil((ctx.getSystemPrompt()?.length || 0) / 3);
      const decision = await select(event.text, 'conversation', ctx, {
        images: !!event.images?.length, contextTokens: systemTokens + Math.ceil(event.text.length / 3) + 8192,
      }, ctx.signal);
      const model = ctx.modelRegistry.find('tokenfactory', decision.pick.id);
      if (!model || !(await pi.setModel(model))) throw new Error('Pi could not apply the selected model');
      pi.appendEntry(ENTRY, { status: 'selected', model: decision.pick.id, provider: 'tokenfactory', input_sha256: decision.input_sha256 });
      await logApplied(ctx, 'conversation', 'applied', model);
      display(ctx, decision);
    } catch (e) {
      if (e instanceof NoSelection) {
        done = false; // User may retry with different constraints; do not invoke a model.
        notice(ctx, e.message, 'error');
        return { action: 'handled' };
      }
      pi.appendEntry(ENTRY, { status: 'native_fallback' });
      await logApplied(ctx, 'conversation', 'native_fallback', ctx.model);
      notice(ctx, 'Routing failed; keeping Pi’s normal model. Check /goldilocks status and the local evidence cache.', 'warning');
    }
    return { action: 'continue' };
  });

  pi.registerCommand('goldilocks', {
    description: 'status | refresh | quality 1-5 | cost 1-5 | capture on/off',
    handler: async (args, ctx) => {
      const [command = 'status', value] = args.trim().split(/\s+/);
      if (command === 'status') {
        const aa = await readJSON(join(CACHE_DIR, 'aa-pages.json'));
        notice(ctx, JSON.stringify({ quality: config.quality, cost: config.cost, capture: config.capture, routed: done,
          current_model: ctx.model ? `${ctx.model.provider}/${ctx.model.id}` : null,
          aa_pages: aa?.pages?.length || 0, aa_as_of: aa?.fetched_at || null, cache: CACHE_DIR,
          last_pick: lastDecision?.pick?.id || null, confidence: lastDecision?.confidence || null }, null, 2));
      } else if (command === 'quality' || command === 'cost') {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error('Use an integer from 1 to 5');
        config[command] = n; notice(ctx, `${command}=${n}; applies to new subagents and future conversation selections.`);
      } else if (command === 'capture') {
        if (!['on', 'off'].includes(value)) throw new Error('Use capture on or capture off');
        config.capture = value === 'on'; notice(ctx, `Training capture ${value}. When on, exact router inputs (including task and AA evidence) and teacher rankings are stored locally.`);
      } else if (command === 'refresh') {
        const catalog = await refreshCatalog(CACHE_DIR, { force: true, signal: AbortSignal.timeout(60000) });
        const aa = await extractAA(CACHE_DIR, { force: true, signal: AbortSignal.timeout(240000) });
        register(catalog); notice(ctx, `Refreshed ${catalog.models.length} catalogue entries and ${aa.pages.length} full AA pages.`);
      } else throw new Error('Use status, refresh, quality N, cost N, or capture on/off');
    },
  });

  pi.registerTool({
    name: 'goldilocks_subagent', label: 'Goldilocks subagent', executionMode: 'sequential',
    description: 'Delegate one task to a subagent. Sol chooses its Token Factory model using the same routing contract as conversation selection. Supply complete initial instructions. Tools are restricted to a subset of your own active built-in tools. No recursive delegation.',
    parameters: Type.Object({
      task: Type.String({ minLength: 1, description: 'Complete initial task/instructions for the subagent; this is the router task too.' }),
      tools: Type.Optional(Type.Array(Type.Union(TOOL_NAMES.map(n => Type.Literal(n))), { description: 'Allowed built-in tools. Defaults to read, grep, find, ls. Never exceeds the parent’s active tools.' })),
    }),
    async execute(_id, params, signal, _update, ctx) {
      if (childRunning) throw new Error('A Goldilocks subagent is already running');
      childRunning = true;
      let child: any, runtime: any;
      try {
        const allowed = new Set(pi.getActiveTools());
        const tools = (params.tools || ['read', 'grep', 'find', 'ls']).filter(n => allowed.has(n));
        if (params.tools?.some(n => !allowed.has(n))) throw new Error('Requested subagent tools exceed the parent’s active permissions');
        let model = ctx.model;
        try {
          const decision = await select(params.task, 'subagent', ctx, { contextTokens: Math.ceil((ctx.getSystemPrompt()?.length || 0) / 3) + Math.ceil(params.task.length / 3) + 8192 }, signal);
          model = ctx.modelRegistry.find('tokenfactory', decision.pick.id);
          display(ctx, decision);
        } catch (e) {
          if (e instanceof NoSelection) return { content: [{ type: 'text', text: e.message }], details: { status: 'no_selection' }, isError: true };
          notice(ctx, 'Subagent routing failed; using the parent’s model as native fallback.', 'warning');
        }
        if (!model) throw new Error('No default subagent model is available');
        await logApplied(ctx, 'subagent', 'applied', model);
        runtime = await ModelRuntime.create({ signal });
        if (providerConfig) runtime.registerProvider('tokenfactory', providerConfig);
        const loader = new DefaultResourceLoader({ cwd: ctx.cwd, agentDir: getAgentDir(),
          noExtensions: true, noSkills: true, noPromptTemplates: true,
          systemPromptOverride: () => ctx.getSystemPrompt() + '\n\nYou are a delegated subagent. Complete only your supplied task; do not delegate further.',
          appendSystemPromptOverride: () => [],
        });
        await loader.reload();
        ({ session: child } = await createAgentSession({ cwd: ctx.cwd, model, modelRuntime: runtime,
          tools, resourceLoader: loader, sessionManager: SessionManager.inMemory(ctx.cwd),
          settingsManager: SettingsManager.inMemory({ retry: { enabled: false, maxRetries: 0 } }),
        }));
        const deadline = AbortSignal.any([signal || new AbortController().signal, AbortSignal.timeout(300000)]);
        const abort = () => { void child.abort(); };
        deadline.addEventListener('abort', abort, { once: true });
        try {
          deadline.throwIfAborted();
          await child.prompt(params.task);
          deadline.throwIfAborted();
          const last = child.messages.filter((m: any) => m.role === 'assistant').at(-1);
          if (!last || last.stopReason === 'error' || last.stopReason === 'aborted') throw new Error('Subagent execution failed');
          return { content: [{ type: 'text', text: child.getLastAssistantText() || '(Subagent returned no text)' }],
            details: { provider: model.provider, model: model.id, tools } };
        } finally { deadline.removeEventListener('abort', abort); }
      } finally {
        child?.dispose();
        if (runtime) await runtime.settleCredentialWrites();
        childRunning = false;
      }
    },
  });
}
