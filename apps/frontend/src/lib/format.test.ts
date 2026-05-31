import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCounter, makeAvatar } from './format.js';

test('formatCounter localizes compact counters', () => {
  assert.equal(formatCounter(999), '999');
  assert.equal(formatCounter(1500), '1.5 тыс.');
  assert.equal(formatCounter(12000), '12 тыс.');
});

test('makeAvatar creates stable placeholder url', () => {
  assert.match(makeAvatar('Анна MVP'), /^https:\/\/api\.dicebear\.com/);
  assert.match(makeAvatar('Анна MVP'), /%D0%90%D0%BD%D0%BD%D0%B0/);
});
