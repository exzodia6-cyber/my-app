import assert from 'node:assert/strict';
import { formatCounter, makeAvatar } from '../../src/lib/format.js';

const started = Date.now();
for (let index = 0; index < 10_000; index += 1) {
  assert.ok(formatCounter(index).length > 0);
  assert.ok(makeAvatar(`user-${index}`).startsWith('https://'));
}
assert.ok(Date.now() - started < 5000, 'frontend utility smoke load should finish under 5 seconds');
console.log('Frontend load smoke: 10k UI utility operations passed');
