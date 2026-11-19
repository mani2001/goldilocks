import type { Catalog, Evidence, RoutingInput, Teacher } from './types.ts';
import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { CACHE_DIR, readJSON, refreshCatalog, extractAA, isFresh } from './evidence.ts';
import { buildPayload, chatCandidates, rankWithTeacher, NoSelection, TEACHER } from './router.ts';

// Shared by in-process selections; filesystem cache is shared across Pi processes.
const catalogRefreshes = new Map<string, Promise<Catalog>>();
const evidenceRefreshes = new Map<string, Promise<Evidence>>();

export async function loadEvidence(dir = CACHE_DIR, { signal, notify = () => {} }: {
  signal?: AbortSignal; notify?: (message: string) => void;
} = {}) {
  const warnings: string[] = [];
  async function refresh<T extends { fetched_at: string }>(file: string, pending: Map<string, Promise<T>>, operation: () => Promise<T>) {
    const path = join(dir, file);
    const old = await readJSON<T>(path);
    try {
      let result = pending.get(path);
      if (!result) {
        result = operation().finally(() => pending.delete(path));
        pending.set(path, result);
      }
      return await result;
    } catch (e) {
      const age = Date.now() - Date.parse(old?.fetched_at ?? '');
      if (old && age >= 0 && age < 7 * 86400000) {
        const warning = `${file} refresh failed; using ${Math.floor(age / 3600000)}h-old cache`;
        notify(warning); warnings.push(warning); return old;
      }
      throw e;
    }
  }
  const [catalog, evidence] = await Promise.all([
    refresh('catalog.json', catalogRefreshes, () => refreshCatalog(dir, { signal })),
    refresh('aa-pages.json', evidenceRefreshes, () => extractAA(dir, { signal })),
  ]);
  if (!catalog.models?.length || !evidence.pages?.length) throw new Error('Evidence cache is empty; run evidence discovery/refresh first');
  return { catalog, evidence, warnings, stale: !isFresh(catalog) || !isFresh(evidence) };
}
export async function decisionLog(dir: string, record: Record<string, unknown>) {
  await mkdir(dir, { recursive: true, mode: 0o700 });
  // Closed metadata schema: never write task text, arbitrary error strings or model reasons here.
  const safe = Object.fromEntries(['at', 'kind', 'input_length', 'input_sha256', 'candidate_ids', 'status', 'model', 'provider', 'snapshot_at', 'latency_ms', 'error_code', 'teacher'].map(k => [k, record[k] ?? null]));
  await appendFile(join(dir, 'decisions.jsonl'), JSON.stringify(safe) + '\n', { mode: 0o600 });
}
export async function routeTask({ task, kind = 'conversation', preferences, requirements, callTeacher, dir = CACHE_DIR, signal, notify, capture = false, timeoutMs, maxEvidenceChars, maxEvidencePages }: RoutingInput & {
  callTeacher: Teacher; dir?: string; signal?: AbortSignal; notify?: (message: string) => void;
  capture?: boolean; timeoutMs?: number;
}) {
  const started = Date.now();
  const meta: Record<string, unknown> = { at: new Date().toISOString(), kind, input_length: task?.length || 0, teacher: TEACHER };
  const log = async (record: Record<string, unknown>) => {
    try { await decisionLog(dir, { ...meta, latency_ms: Date.now() - started, ...record }); }
    catch { if (notify) notify('Goldilocks decision log could not be written'); else process.stderr.write('Goldilocks decision log could not be written\n'); }
  };
  try {
    const { catalog, evidence, warnings } = await loadEvidence(dir, { signal, notify });
    meta.candidate_ids = chatCandidates(catalog).map(m => m.id); meta.snapshot_at = evidence.fetched_at;
    const payload = buildPayload({ task, kind, preferences, requirements, catalog, evidence, maxEvidenceChars, maxEvidencePages });
    const result = await rankWithTeacher(payload, callTeacher, { signal, timeoutMs });
    if (capture) {
      // Opt-in, separate from metadata logging. No execution-session history is captured.
      try {
        await mkdir(join(dir, 'training'), { recursive: true, mode: 0o700 });
        await appendFile(join(dir, 'training', 'examples.jsonl'), JSON.stringify({ input: payload, output: result, at: meta.at }) + '\n', { mode: 0o600 });
      } catch {
        if (notify) notify('Training capture failed; the routing decision is still valid');
        else process.stderr.write('Training capture failed; the routing decision is still valid\n');
      }
    }
    await log({ status: 'ranked', model: result.pick.id, provider: result.pick.provider, input_sha256: result.input_sha256 });
    return { ...result, warnings };
  } catch (error) {
    await log({ status: error instanceof NoSelection ? 'no_selection' : 'fallback', error_code: error instanceof NoSelection ? 'infeasible' : signal?.aborted ? 'cancelled' : 'router_failure' });
    throw error;
  }
}
