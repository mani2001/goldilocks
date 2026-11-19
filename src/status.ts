import type { chatCandidates } from './router.ts';

interface UsageEntry {
  type: string;
  data?: unknown;
  message?: {
    role: string;
    provider?: string;
    usage?: {
      input?: number; output?: number; cacheRead?: number; cacheWrite?: number;
      cost?: { total?: number; totalFromProvider?: boolean };
    };
  };
}

// Pi stores token counts and catalogue-priced costs on each assistant message.
// Keep that historical pricing rather than repricing earlier responses at today's rates.
export function executionUsage(entries: UsageEntry[]) {
  const messages = entries.filter(e => e.type === 'message').map(e => e.message)
    .filter(m => m !== undefined).filter(m => m.role === 'assistant' && m.provider === 'tokenfactory');
  let input = 0, output = 0, cacheRead = 0, cacheWrite = 0, cost = 0, missing = 0;
  let allProviderReported = messages.length > 0;
  for (const message of messages) {
    const usage = message.usage;
    if (!usage) { missing++; allProviderReported = false; continue; }
    input += usage.input || 0; output += usage.output || 0;
    cacheRead += usage.cacheRead || 0; cacheWrite += usage.cacheWrite || 0;
    if (typeof usage.cost?.total === 'number' && Number.isFinite(usage.cost.total) && usage.cost.total >= 0) cost += usage.cost.total;
    else missing++;
    if (usage.cost?.totalFromProvider !== true) allProviderReported = false;
  }
  return {
    scope: 'Token Factory responses on this conversation branch; excludes router and subagent calls',
    responses: messages.length, input_tokens: input, output_tokens: output, cache_read_tokens: cacheRead, cache_write_tokens: cacheWrite,
    cost_usd: missing ? null : Number(cost.toFixed(8)),
    cost_source: allProviderReported ? 'provider_reported' : 'catalog_estimate_not_invoice',
    missing_usage_records: missing,
  };
}
export function modelPricing(model: Pick<ReturnType<typeof chatCandidates>[number], 'provider' | 'currency' | 'cost_in_per_1m' | 'cost_out_per_1m' | 'cache_read_per_1m' | 'blended_cost_per_1m'> | null | undefined) {
  if (!model) return null;
  return { provider: model.provider, currency: model.currency, unit: 'USD per 1,000,000 tokens',
    input: model.cost_in_per_1m, output: model.cost_out_per_1m, cache_read: model.cache_read_per_1m,
    blended: model.blended_cost_per_1m ?? null, blend: '50% uncached input + 50% output' };
}
