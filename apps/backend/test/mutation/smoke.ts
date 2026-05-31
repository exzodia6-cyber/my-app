import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const socialSource = readFileSync(new URL('../../src/utils/social.ts', import.meta.url), 'utf8');
assert.ok(socialSource.includes('encodeURIComponent'), 'mutation guard: avatar seed must stay URL-encoded');
assert.ok(!socialSource.includes('passwordHash: true'), 'mutation guard: public select must not expose password hashes');
console.log('Backend mutation smoke: critical guards survived');
