import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../src/app.js';

test('GET /health returns service status', async () => {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', service: 'social-network-api' });
  } finally {
    server.close();
  }
});
