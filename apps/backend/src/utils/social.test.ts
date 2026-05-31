import test from 'node:test';
import assert from 'node:assert/strict';
import { avatarFor, publicUserSelect } from './social.js';

test('avatarFor returns encoded placeholder url', () => {
  const url = avatarFor('Анна MVP');
  assert.match(url, /^https:\/\/api\.dicebear\.com/);
  assert.match(url, /%D0%90%D0%BD%D0%BD%D0%B0/);
});

test('publicUserSelect never exposes passwordHash', () => {
  assert.equal('passwordHash' in publicUserSelect, false);
  assert.equal(publicUserSelect.profile, true);
});
