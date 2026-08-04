import test from 'node:test';
import assert from 'node:assert/strict';

import { isRetryableSubmissionError } from './retry-utils.js';

test('detects transient websocket disconnects from transaction submission', () => {
  const err = new Error('SubmissionError: Transaction submission failed');
  (err as Error & { cause?: unknown }).cause = new Error('disconnected from wss://rpc.preview.midnight.network/: 1000:: Normal Closure');

  assert.equal(isRetryableSubmissionError(err), true);
});

test('ignores unrelated errors', () => {
  assert.equal(isRetryableSubmissionError(new Error('Not enough Dust')), false);
});
