import test from 'node:test';
import assert from 'node:assert/strict';
import { executionUsage, modelPricing } from '../src/status.ts';
const response = (provider: string, cost: number, usage = {}) => ({ type: 'message', message: { role: 'assistant', provider,
  usage: { input: 1000, output: 100, cacheRead: 200, cacheWrite: 0, cost: { total: cost }, ...usage } } });

test('cost status sums recorded Token Factory usage, excluding the router and unrelated entries', () => {
  const result = executionUsage([response('tokenfactory', 0.00013), response('openai-codex', 9), response('tokenfactory', 0.00027), { type: 'custom', data: { cost: 99 } }]);
  assert.equal(result.cost_usd, 0.0004);
  assert.equal(result.input_tokens, 2000);
  assert.equal(result.output_tokens, 200);
  assert.equal(result.cost_source, 'catalog_estimate_not_invoice');
});
test('missing usage is unknown instead of a misleading zero', () => {
  const result = executionUsage([{ type: 'message', message: { role: 'assistant', provider: 'tokenfactory' } }]);
  assert.equal(result.cost_usd, null);
  assert.equal(result.missing_usage_records, 1);
});
test('price rates carry currency, units and distinct input/output charges', () => {
  assert.deepEqual(modelPricing({ provider:'tokenfactory',currency:'USD',cost_in_per_1m:0.1,cost_out_per_1m:0.3,cache_read_per_1m:null,blended_cost_per_1m:0.2 }), {
    provider:'tokenfactory',currency:'USD',unit:'USD per 1,000,000 tokens',input:0.1,output:0.3,cache_read:null,
    blended:0.2,blend:'50% uncached input + 50% output',
  });
});
