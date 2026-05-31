import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const apiSource = readFileSync(new URL('../../src/lib/api.ts', import.meta.url), 'utf8');
assert.ok(apiSource.includes('Authorization'), 'mutation guard: API client must send JWT Authorization header');
assert.ok(apiSource.includes('Backend недоступен'), 'mutation guard: demo fallback message must stay user-friendly');
console.log('Frontend mutation smoke: critical guards survived');
