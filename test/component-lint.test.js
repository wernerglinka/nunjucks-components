/**
 * Runs the canon component lint as part of the test suite, so the contracts
 * it guards (layer safety, token references, placeholder links, styling
 * dependencies, focus indicators, schema defaults) cannot regress unnoticed.
 */

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('component lint reports no errors', async () => {
  try {
    await run(process.execPath, ['scripts/component-lint.mjs'], { cwd: root });
  } catch (error) {
    assert.fail(`component lint failed:\n${error.stdout}`);
  }
});
