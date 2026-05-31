import assert from 'node:assert/strict';
import { app } from '../../src/app.js';

const server = app.listen(0);
await new Promise<void>((resolve) => server.once('listening', resolve));
const address = server.address();
assert.ok(address && typeof address === 'object');
try {
  const started = Date.now();
  const responses = await Promise.all(Array.from({ length: 25 }, () => fetch(`http://127.0.0.1:${address.port}/health`)));
  assert.equal(responses.every((response) => response.ok), true);
  assert.ok(Date.now() - started < 5000, 'health smoke load should finish under 5 seconds');
  console.log('Backend load smoke: 25 concurrent health checks passed');
} finally {
  server.close();
}
