import { CACHE_DIR, refreshCatalog, discoverAA, discoverIndexLinks, extractAA, readJSON } from '../src/evidence.mjs';
import { join } from 'node:path';
const command = process.argv[2] || 'status';
try {
  if (command === 'catalog') {
    const x = await refreshCatalog();
    console.log(JSON.stringify({ models: x.models.length, ids: x.models.map(m => m.id), fetched_at: x.fetched_at }, null, 2));
  } else if (command === 'discover') {
    const x = await discoverAA(CACHE_DIR, { force: process.argv.includes('--force') });
    console.log(JSON.stringify({ urls: x.urls, at_limit: x.at_limit, fetched_at: x.fetched_at }, null, 2));
  } else if (command === 'links') {
    const x = await discoverIndexLinks();
    console.log(JSON.stringify({ urls: x.urls, count: x.urls.length }, null, 2));
  } else if (command === 'refresh') {
    const catalog = await refreshCatalog();
    const aa = await extractAA(CACHE_DIR, { force: process.argv.includes('--force') });
    console.log(JSON.stringify({ models: catalog.models.length, pages: aa.pages.length, fetched_at: aa.fetched_at }));
  } else if (command === 'status') {
    const c = await readJSON(join(CACHE_DIR, 'catalog.json')), a = await readJSON(join(CACHE_DIR, 'aa-pages.json'));
    console.log(JSON.stringify({ models: c?.models?.length || 0, pages: a?.pages?.length || 0, aa_fetched_at: a?.fetched_at || null, cache: CACHE_DIR }));
  } else throw new Error('Use catalog, discover [--force], refresh [--force], or status');
} catch (e) { console.error(e.message); process.exitCode = 1; }
