import type { CatalogModel, TeacherInput } from '../src/types.ts';
import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { chatCandidates, eligibleCandidates, buildPayload, parseRanking, rankWithTeacher, NoSelection, chooseEvidence } from '../src/router.ts';
import { isAAUrl, isFresh, atomicJSON, extractAA, readJSON, refreshCatalog } from '../src/evidence.ts';
import { routeTask } from '../src/service.ts';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const model = (id: string, extra: Partial<CatalogModel> = {}) => ({ id, architecture: { modality: 'text->text' }, context_length: 64000,
  supported_features: ['tools'], pricing: { prompt: '0.000001', completion: '0.000002' }, ...extra });
const catalog = { fetched_at: new Date().toISOString(), models: [model('cheap'), model('vision', { architecture: { modality: 'text+image->text' }, context_length: 128000 })] };
const page = { url: 'https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index', content: 'Benchmark observations '.repeat(20), fetched_at: new Date().toISOString(), sha256: 'a' };
const evidence = { fetched_at: new Date().toISOString(), pages: [page] };
const payload = () => buildPayload({ task: 'Review code', catalog, evidence });
const answer = '{"ranked_candidate_ids":["cheap","vision"],"reasons":["adequate","stronger"]}';

async function temp(t: TestContext) {
  const dir = await mkdtemp(join(tmpdir(), 'goldilocks-'));
  t.after(() => rm(dir, { recursive: true, force: true })); return dir;
}

test('provider catalogue conversion excludes non-chat/non-tool entries and converts per-token prices exactly', () => {
  const candidates = chatCandidates({ models: [...catalog.models, model('embed', { architecture: { modality: 'text->embedding' } }), model('no-tools', { supported_features: [] })] });
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].cost_in_per_1m, 1);
  assert.equal(candidates[0].cost_out_per_1m, 2);
  assert.equal(candidates[0].latency, null);
  assert.equal(chatCandidates({ models: [model('unknown', { pricing: {} })] })[0].cost_in_per_1m, null);
});
test('hard masks enforce images, context and allow-list together', () => {
  const candidates = chatCandidates(catalog);
  assert.deepEqual(eligibleCandidates(candidates, { images: true, contextTokens: 100000 }).map(m => m.id), ['vision']);
  assert.deepEqual(eligibleCandidates(candidates, { images: true, allowedModels: ['cheap'] }), []);
  assert.throws(() => buildPayload({ task: 'x', catalog, evidence, requirements: { allowedModels: [] } }), NoSelection);
});
test('rejects invalid preferences and never silently truncates task text', () => {
  assert.throws(() => buildPayload({ task: 'x', catalog, evidence, preferences: { quality: 6 } }));
  assert.throws(() => buildPayload({ task: 'x'.repeat(100001), catalog, evidence }));
  assert.equal(payload().task, 'Review code');
});
test('whole-page evidence budgeting discloses omitted pages without truncating selected content', () => {
  const more = { ...page, url: 'https://artificialanalysis.ai/evaluations/scicode', content: 'x'.repeat(600) };
  const chosen = chooseEvidence([page, more], 'code', { maxChars: page.content.length, maxPages: 2 });
  assert.equal(chosen.pages[0].content, page.content);
  assert.deepEqual(chosen.omitted_urls, [more.url]);
});
test('untrusted teacher ranking cannot introduce IDs, duplicates or omit required alternatives', () => {
  for (const ids of [['malicious','vision'], ['cheap','cheap'], ['cheap']]) {
    assert.throws(() => parseRanking(JSON.stringify({ ranked_candidate_ids: ids, reasons: ['a','b'] }), payload()));
  }
  const result = parseRanking(answer, payload());
  assert.equal(result.pick.provider, 'tokenfactory');
  assert.equal(result.confidence.calibrated, false);
  assert.equal(result.confidence.value, null);
  assert.equal(result.pick.cost_in_per_1m, 1);
});
test('bounded repair uses the exact same context and no tool definitions', async () => {
  const calls: TeacherInput[] = [];
  const result = await rankWithTeacher(payload(), async input => {
    calls.push(input); return calls.length === 1 ? 'not JSON' : answer;
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].prompt, calls[1].prompt);
  assert.equal('tools' in calls[0], false);
  assert.equal(result.pick.id, 'cheap');
});
test('cancelled routing does not invoke the teacher', async () => {
  let called = false;
  await assert.rejects(rankWithTeacher(payload(), async () => { called = true; return answer; }, { signal: AbortSignal.abort() }));
  assert.equal(called, false);
});
test('AA URL allowlist rejects external hosts, credentials and arbitrary paths', () => {
  for (const u of ['https://evil.test/evaluations/foo', 'https://artificialanalysis.ai.evil.test/evaluations/foo', 'https://x@artificialanalysis.ai/evaluations/foo', 'http://artificialanalysis.ai/evaluations/foo', 'https://artificialanalysis.ai/microevals/foo']) assert.equal(isAAUrl(u), false);
  assert.equal(isAAUrl(page.url), true);
  assert.equal(isAAUrl('https://artificialanalysis.ai/indexes/engineering'), true);
});
test('cache expiry rejects missing and future timestamps', () => {
  assert.equal(isFresh({ fetched_at: new Date().toISOString() }), true);
  assert.equal(isFresh({ fetched_at: new Date(Date.now() - 86400001).toISOString() }), false);
  assert.equal(isFresh({ fetched_at: new Date(Date.now() + 10000).toISOString() }), false);
  assert.equal(isFresh({}), false);
});
test('fresh cache makes no provider/Tavily calls, excludes task text from mandatory logs, capture is opt-in', async t => {
  const dir = await temp(t);
  await atomicJSON(join(dir,'catalog.json'), catalog);
  await atomicJSON(join(dir,'aa-pages.json'), evidence);
  await atomicJSON(join(dir,'aa-urls.json'), { urls: [page.url] });
  const original = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('Unexpected network request'); };
  t.after(() => { globalThis.fetch = original; });
  const result = await routeTask({ task: 'PRIVATE_TASK_123', dir, callTeacher: async () => answer });
  assert.equal(result.pick.id, 'cheap');
  const logs = await readFile(join(dir, 'decisions.jsonl'), 'utf8');
  assert.equal(logs.includes('PRIVATE_TASK_123'), false);
  await assert.rejects(stat(join(dir,'training','examples.jsonl')), { code: 'ENOENT' });
  await routeTask({ task: 'EXPLICIT_CAPTURE', dir, callTeacher: async () => answer, capture: true });
  const saved = JSON.parse((await readFile(join(dir,'training','examples.jsonl'),'utf8')).trim());
  assert.equal(saved.input.task, 'EXPLICIT_CAPTURE');
  assert.equal(saved.input.evidence.pages[0].content, page.content);
  assert.equal((await stat(join(dir,'training','examples.jsonl'))).mode & 0o777, 0o600);
});
test('partial Extract response never replaces the last valid snapshot', async t => {
  const dir = await temp(t);
  await atomicJSON(join(dir,'aa-pages.json'), evidence);
  await atomicJSON(join(dir,'aa-urls.json'), { urls: [page.url, 'https://artificialanalysis.ai/evaluations/scicode'] });
  const original = globalThis.fetch, oldKey = process.env.TAVILY_API_KEY;
  process.env.TAVILY_API_KEY = 'test';
  globalThis.fetch = async () => Response.json({ results: [{ url: page.url, raw_content: page.content }], failed_results: [{ url: 'https://artificialanalysis.ai/evaluations/scicode' }] });
  t.after(() => { globalThis.fetch = original; if (oldKey === undefined) delete process.env.TAVILY_API_KEY; else process.env.TAVILY_API_KEY = oldKey; });
  await assert.rejects(extractAA(dir, { force: true }), /incomplete/);
  assert.deepEqual(await readJSON(join(dir,'aa-pages.json')), evidence);
});
test('empty eligible pool records no-selection and never calls teacher', async t => {
  const dir = await temp(t); let called = false;
  await atomicJSON(join(dir,'catalog.json'), catalog);
  await atomicJSON(join(dir,'aa-pages.json'), evidence);
  await atomicJSON(join(dir,'aa-urls.json'), { urls: [page.url] });
  await assert.rejects(routeTask({ task: 'task', dir, requirements: { allowedModels: [] }, callTeacher: async () => { called = true; return answer; } }), NoSelection);
  assert.equal(called, false);
  assert.equal(JSON.parse((await readFile(join(dir,'decisions.jsonl'),'utf8')).trim()).status, 'no_selection');
});

test('concurrent catalogue refreshes share a filesystem cache rather than issuing duplicate requests', async t => {
  const dir = await temp(t); let requests = 0;
  const original = globalThis.fetch, key = process.env.NEBIUS_API_KEY;
  process.env.NEBIUS_API_KEY = 'test';
  globalThis.fetch = async () => { requests++; await new Promise(resolve => setTimeout(resolve, 25)); return Response.json({ data: catalog.models }); };
  t.after(() => { globalThis.fetch = original; if (key === undefined) delete process.env.NEBIUS_API_KEY; else process.env.NEBIUS_API_KEY = key; });
  const [a,b] = await Promise.all([refreshCatalog(dir), refreshCatalog(dir)]);
  assert.equal(requests, 1);
  assert.deepEqual(a, b);
});
test('teacher timeout is passed to the isolated call and failures leave only metadata', async t => {
  const dir = await temp(t);
  await atomicJSON(join(dir,'catalog.json'), catalog);
  await atomicJSON(join(dir,'aa-pages.json'), evidence);
  await atomicJSON(join(dir,'aa-urls.json'), { urls: [page.url] });
  await assert.rejects(routeTask({ task: 'SECRET_TIMEOUT_TASK', dir, timeoutMs: 10,
    callTeacher: async ({ signal }) => new Promise((_, reject) => {
      const keepAlive = setTimeout(() => reject(new Error('deadline was ignored')), 500);
      signal.addEventListener('abort', () => { clearTimeout(keepAlive); reject(signal.reason); }, { once: true });
    }),
  }));
  const log = await readFile(join(dir,'decisions.jsonl'),'utf8');
  assert.equal(log.includes('SECRET_TIMEOUT_TASK'), false);
  assert.equal(JSON.parse(log.trim()).status, 'fallback');
});

test('dollar ceiling uses an explicit 50/50 rate and filters before the teacher sees candidates', () => {
  const catalogWithPrices = { ...catalog, models: [
    model('budget', { pricing: { prompt: '0.0000001', completion: '0.0000003' } }),
    model('expensive', { pricing: { prompt: '0.000001', completion: '0.000003' } }),
    model('unpriced', { pricing: {} }),
  ] };
  const p = buildPayload({ task: 'Review code', catalog: catalogWithPrices, evidence,
    preferences: { quality: 5, maxCostPerMillionTokens: 0.20 } });
  assert.deepEqual(p.candidates.map(c => c.id), ['budget']);
  assert.equal(p.candidates[0].cost_in_per_1m, 0.1);
  assert.equal(p.candidates[0].blended_cost_per_1m, 0.2);
  assert.equal(p.requirements.maxCostPerMillionTokens, 0.2);
  assert.equal(p.preferences.quality, 5);
  assert.equal('cost' in p.preferences, false);
  assert.equal(p.cost_basis.input_fraction, 0.5);
  assert.equal(p.cost_basis.output_fraction, 0.5);
  assert.equal(p.alternatives_count, 0);
  assert.throws(() => parseRanking('{"ranked_candidate_ids":["expensive"],"reasons":["strong"]}', p), /ineligible/);
});
test('cost ceiling accepts null and zero but rejects invalid dollar amounts', () => {
  for (const value of [-1, NaN, Infinity, '0.50', false]) {
    assert.throws(() => buildPayload({ task: 'task', catalog, evidence, preferences: { maxCostPerMillionTokens: value as number } }), /USD amount/);
  }
  assert.equal(payload().requirements.maxCostPerMillionTokens, null);
  assert.equal(payload().candidates.length, 2);
  assert.throws(() => buildPayload({ task: 'task', catalog, evidence, preferences: { maxCostPerMillionTokens: 0 } }), NoSelection);
  const free = { ...catalog, models: [model('free', { pricing: { prompt: '0', completion: '0' } })] };
  assert.equal(buildPayload({ task: 'task', catalog: free, evidence, preferences: { maxCostPerMillionTokens: 0 } }).candidates[0].id, 'free');
});
