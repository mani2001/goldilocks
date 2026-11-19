import { importPi } from '../src/pi-host.ts';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { ModelRuntime, DefaultResourceLoader, getAgentDir, createAgentSession, SessionManager, SettingsManager } = await importPi();
const runtime = await ModelRuntime.create();
const teacher = runtime.getModel('openai-codex', 'gpt-6.1-sol');
if (!teacher) throw new Error('Teacher not available');
const loader = new DefaultResourceLoader({ cwd: root, agentDir: getAgentDir(),
  noExtensions: true, noSkills: true, noPromptTemplates: true, noContextFiles: true,
  additionalExtensionPaths: [join(root, 'extensions/goldilocks.ts')],
  systemPromptOverride: () => 'Follow the user request. Do not use any tools unless the user explicitly asks.',
  appendSystemPromptOverride: () => [],
});
await loader.reload();
const extensionErrors = loader.getExtensions().errors;
if (extensionErrors.length) throw new Error(`Extension load failed: ${extensionErrors.map(e => e.error).join('; ')}`);
const { session } = await createAgentSession({ cwd: root, modelRuntime: runtime, model: teacher,
  resourceLoader: loader, sessionManager: SessionManager.inMemory(root),
  settingsManager: SettingsManager.inMemory({ retry: { enabled: false, maxRetries: 0 } }),
});
const abort = setTimeout(() => { void session.abort(); }, 120000);
try {
  await session.bindExtensions({});
  const delegation = process.argv.includes('--delegation');
  await session.prompt(delegation
    ? 'This task requires native function/tool calling. Call the goldilocks_subagent tool exactly once with task "Reply with exactly CHILD_READY. Do not use tools or change files." and tools []. Then report the child response. Do not simulate a tool call as text or JSON. Do not use any other tools.'
    : 'Reply with exactly READY. This is a simple text-only connection test. Do not call tools or change files.');
  console.log(JSON.stringify({ phase: 'conversation', model: session.model?.id, provider: session.model?.provider,
    response: session.getLastAssistantText(), routing_attempts: session.sessionManager.getBranch().filter(e => e.type === 'custom' && e.customType === 'goldilocks-selection').length }));
  if (session.model?.provider !== 'tokenfactory') throw new Error('Conversation did not switch to Token Factory');
  if (delegation) {
    const delegated = session.messages.filter(m => m.role === 'toolResult').findLast(m => m.toolName === 'goldilocks_subagent');
    console.log(JSON.stringify({ phase: 'natural_delegation', called: !!delegated, isError: delegated?.isError ?? null }));
    if (!delegated || delegated.isError) throw new Error('Execution model did not successfully invoke the subagent tool');
  }
  const modelId = session.model.id;
  await session.prompt('Reply with exactly STILL_READY. Do not call tools.');
  if (session.model.id !== modelId) throw new Error('Model changed on follow-up');
  console.log(JSON.stringify({ phase: 'follow_up', model: session.model.id, response: session.getLastAssistantText() }));
  await session.reload();
  await session.prompt('Reply with exactly RELOADED_READY. Do not call tools.');
  if (session.model.id !== modelId) throw new Error('Model changed after extension reload');
  const attempts = session.sessionManager.getBranch().filter(e => e.type === 'custom' && e.customType === 'goldilocks-selection').length;
  if (attempts !== 1) throw new Error('Reload triggered another routing attempt');
  console.log(JSON.stringify({ phase: 'reload', model: session.model.id, routing_attempts: attempts, response: session.getLastAssistantText() }));
  if (process.argv.includes('--subagent')) {
    const tool = session.agent.state.tools.find(t => t.name === 'goldilocks_subagent');
    if (!tool) throw new Error('Subagent tool is missing from the parent loadout');
    const result = await tool.execute('smoke-child', { task: 'Reply with exactly CHILD_READY. Do not use tools.', tools: [] }, AbortSignal.timeout(90000));
    console.log(JSON.stringify({ phase: 'subagent_direct_tool', isError: result.isError ?? false, details: result.details,
      parent_model: session.model.id, response: result.content }));
    if (result.isError || !result.content.some(b => b.type === 'text' && b.text.includes('CHILD_READY'))) throw new Error('Subagent direct-tool smoke test failed');
    if (session.model.id !== modelId) throw new Error('Delegation changed the parent model');
  }
} finally { clearTimeout(abort); session.dispose(); await runtime.settleCredentialWrites(); }
