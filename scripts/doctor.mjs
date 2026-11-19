import { importPi } from '../src/pi-host.mjs';
import { readJSON, CACHE_DIR } from '../src/evidence.mjs';
import { join } from 'node:path';
const { ModelRuntime } = await importPi();
const runtime = await ModelRuntime.create();
try {
  const model = runtime.getModel('openai-codex', 'gpt-6.1-sol');
  const auth = await runtime.checkAuth('openai-codex', { signal: AbortSignal.timeout(15000) });
  const cat = await readJSON(join(CACHE_DIR, 'catalog.json')), pages = await readJSON(join(CACHE_DIR, 'aa-pages.json'));
  console.log(JSON.stringify({ teacher: model?.id || null, codex_authenticated: !!auth,
    token_factory_key_configured: !!process.env.NEBIUS_API_KEY, tavily_key_configured: !!process.env.TAVILY_API_KEY,
    catalog_entries: cat?.models?.length || 0, aa_pages: pages?.pages?.length || 0 }, null, 2));
} finally { await runtime.settleCredentialWrites(); }
