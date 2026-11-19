import { mkdir, readFile, writeFile, rename, unlink, open, stat } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';

export const TF_BASE = 'https://api.tokenfactory.nebius.com/v1';
export const AA_ROOT = 'https://artificialanalysis.ai/leaderboards/models';
export const TTL_MS = 24 * 60 * 60 * 1000;
export const CACHE_DIR = process.env.GOLDILOCKS_CACHE_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', '.cache', 'goldilocks');
export function isAAUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && u.hostname === 'artificialanalysis.ai' && !u.username && !u.password &&
      (u.pathname === '/indexes' || /^\/indexes\/[a-z0-9-]+\/?$/.test(u.pathname) || u.pathname === '/evaluations' || u.pathname === '/leaderboards/models' || /^\/evaluations\/[a-z0-9-]+\/?$/.test(u.pathname) ||
       /^\/leaderboards\/[a-z0-9-]+\/?$/.test(u.pathname));
  } catch { return false; }
}
export async function readJSON(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return null; throw new Error(`Invalid local cache: ${path}`, { cause: e }); }
}
export async function atomicJSON(path, value) {
  const tmp = `${path}.${randomUUID()}.tmp`;
  await mkdir(join(path, '..'), { recursive: true, mode: 0o700 });
  try {
    await writeFile(tmp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
    await rename(tmp, path);
  } finally { await unlink(tmp).catch(e => { if (e.code !== 'ENOENT') throw e; }); }
}
export function isFresh(value, now = Date.now(), ttl = TTL_MS) {
  const age = now - Date.parse(value?.fetched_at);
  return Number.isFinite(age) && age >= 0 && age < ttl;
}
async function requestJSON(url, options = {}, timeout = 60000) {
  const response = await fetch(url, { ...options, signal: AbortSignal.any([AbortSignal.timeout(timeout), ...(options.signal ? [options.signal] : [])]) });
  if (!response.ok) throw new Error(`${new URL(url).hostname}: HTTP ${response.status}`);
  return response.json();
}
export async function tavily(endpoint, body, signal) {
  if (!process.env.TAVILY_API_KEY) throw new Error('TAVILY_API_KEY is not configured');
  return requestJSON(`https://api.tavily.com/${endpoint}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
    body: JSON.stringify(body), signal,
  }, endpoint === 'crawl' ? 180000 : 75000);
}
async function withCacheLock(dir, name, operation, signal) {
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const path = join(dir, `${name}.lock`), started = Date.now();
  let handle;
  while (!handle) {
    signal?.throwIfAborted();
    try { handle = await open(path, 'wx', 0o600); }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      // Recover an abandoned lock, never a normally bounded refresh.
      try { if (Date.now() - (await stat(path)).mtimeMs > 15 * 60000) await unlink(path); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (Date.now() - started > 240000) throw new Error('Evidence cache is busy; refresh deadline exceeded');
      await delay(200, undefined, { signal });
    }
  }
  try { return await operation(); }
  finally { await handle.close(); await unlink(path); }
}
export async function refreshCatalog(dir = CACHE_DIR, options = {}) {
  return withCacheLock(dir, 'catalog', () => updateCatalog(dir, options), options.signal);
}
async function updateCatalog(dir, { force = false, signal } = {}) {
  const path = join(dir, 'catalog.json');
  const old = await readJSON(path);
  if (!force && isFresh(old) && old.models?.length) return old;
  if (!process.env.NEBIUS_API_KEY) throw new Error('NEBIUS_API_KEY is not configured');
  const raw = await requestJSON(`${TF_BASE}/models?verbose=true`, {
    headers: { Authorization: `Bearer ${process.env.NEBIUS_API_KEY}` }, signal,
  });
  if (!Array.isArray(raw.data) || !raw.data.length) throw new Error('Token Factory returned no models');
  const result = { schema_version: 1, fetched_at: new Date().toISOString(), source: `${TF_BASE}/models?verbose=true`, models: raw.data };
  await atomicJSON(path, result);
  return result;
}
export function pageRecord(result, time = new Date().toISOString()) {
  if (!isAAUrl(result.url) || typeof result.raw_content !== 'string' || result.raw_content.trim().length < 100) return null;
  return { url: result.url, fetched_at: time, content: result.raw_content, sha256: createHash('sha256').update(result.raw_content).digest('hex') };
}
// One deliberate discovery crawl. Daily refresh uses the saved URL list, never another crawl.
export async function discoverAA(dir = CACHE_DIR, { force = false, signal } = {}) {
  const manifestPath = join(dir, 'aa-urls.json');
  const old = await readJSON(manifestPath);
  if (old?.urls?.length && !force) return old;
  const raw = await tavily('crawl', {
    url: AA_ROOT, max_depth: 2, max_breadth: 80, limit: 100,
    select_domains: ['^artificialanalysis\\.ai$'],
    select_paths: ['^/leaderboards/.*', '^/evaluations/.*'],
    allow_external: false, extract_depth: 'advanced', format: 'markdown',
  }, signal);
  const pages = (raw.results || []).map(x => pageRecord(x)).filter(Boolean);
  const urls = [...new Set([AA_ROOT, ...pages.map(p => p.url)])];
  if (!pages.length) throw new Error('AA discovery returned no usable pages; no cache was replaced');
  const result = { schema_version: 1, fetched_at: new Date().toISOString(), urls, crawl_limit: 100, at_limit: (raw.results?.length || 0) >= 100, request_id: raw.request_id };
  await atomicJSON(join(dir, 'aa-crawl.json'), { ...raw, saved_at: result.fetched_at });
  await atomicJSON(join(dir, 'aa-pages.json'), { schema_version: 1, fetched_at: result.fetched_at, pages, failures: raw.failed_results || [] });
  await atomicJSON(manifestPath, result);
  return result;
}
export async function extractAA(dir = CACHE_DIR, options = {}) {
  return withCacheLock(dir, 'aa', () => updateAA(dir, options), options.signal);
}
async function updateAA(dir, { force = false, signal } = {}) {
  const old = await readJSON(join(dir, 'aa-pages.json'));
  const manifest = await readJSON(join(dir, 'aa-urls.json'));
  if (!manifest?.urls?.length) throw new Error('AA cache is empty. Run npm run evidence -- discover first.');
  const urls = manifest.urls;
  if (!urls.every(isAAUrl)) throw new Error('AA URL cache contains a non-allowlisted URL');
  if (!force && old?.pages?.length && isFresh(old) && urls.every(url => old.pages.some(p => p.url === url))) return old;
  const pages = !force && isFresh(old) ? old.pages.filter(p => urls.includes(p.url)) : [];
  const pending = urls.filter(url => !pages.some(p => p.url === url));
  const failures = [];
  for (let i = 0; i < pending.length; i += 20) {
    const batch = pending.slice(i, i + 20);
    // No query/chunks: retain full extracted page contents.
    const raw = await tavily('extract', { urls: batch, extract_depth: 'advanced', format: 'markdown' }, signal);
    const extracted = (raw.results || []).map(x => pageRecord(x)).filter(p => p && batch.includes(p.url));
    pages.push(...extracted);
    for (const url of batch) if (!extracted.some(p => p.url === url)) failures.push({ url, reason: 'Extraction missing or invalid' });
  }
  if (failures.length) throw new Error(`AA refresh incomplete (${failures.length}/${urls.length} pages failed); last valid snapshot retained`);
  const snapshot = { schema_version: 1, fetched_at: pages.map(p => p.fetched_at).sort()[0], pages, failures: [] };
  await atomicJSON(join(dir, 'aa-pages.json'), snapshot);
  return snapshot;
}

// Crawl sometimes returns only the landing page. Discover linked benchmark pages
// from AA's directory without repeating the one-time crawl.
export async function discoverIndexLinks(dir = CACHE_DIR, { signal } = {}) {
  const raw = await tavily('extract', {
    urls: ['https://artificialanalysis.ai/indexes', 'https://artificialanalysis.ai/evaluations', 'https://artificialanalysis.ai/evaluations/artificial-analysis-intelligence-index'],
    extract_depth: 'advanced', format: 'markdown',
  }, signal);
  const records = (raw.results || []).map(x => pageRecord(x)).filter(Boolean);
  if (!records.length) throw new Error('AA index directory extraction failed');
  const manifest = await readJSON(join(dir, 'aa-urls.json'));
  const urls = new Set(manifest?.urls || [AA_ROOT]);
  for (const p of records) {
    urls.add(p.url);
    for (const match of p.content.matchAll(/\]\(([^)]+)\)/g)) {
      try {
        const url = new URL(match[1], p.url); url.hash = ''; url.search = '';
        if (isAAUrl(url.href)) urls.add(url.href);
      } catch { /* Malformed links in untrusted pages are not fetched. */ }
    }
  }
  if (urls.size > 150) throw new Error('AA discovery exceeds 150 pages; review the URL inventory');
  const result = { ...manifest, schema_version: 1, fetched_at: new Date().toISOString(), urls: [...urls].sort(), discovery: 'crawl + index-directory links' };
  await atomicJSON(join(dir, 'aa-directory.json'), { records, failures: raw.failed_results || [] });
  await atomicJSON(join(dir, 'aa-urls.json'), result);
  return result;
}
