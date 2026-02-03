/**
 * Gemini CLI E2E (opt-in)
 *
 * Run only when GEMINI_E2E=1 is set to avoid flaky CI or quota usage.
 */

const { spawn, spawnSync } = require('child_process');

const SHOULD_RUN = process.env.GEMINI_E2E === '1';
const MODEL = process.env.GEMINI_E2E_MODEL || 'gemini-2.5-flash';
const TIMEOUT_MS = Number(process.env.GEMINI_E2E_TIMEOUT_MS || 60000);

const runTest = SHOULD_RUN ? test : test.skip;

function isGeminiAvailable() {
  const result = spawnSync('gemini', ['--version'], {
    shell: true,
    windowsHide: true
  });
  return result.status === 0;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      shell: true,
      windowsHide: true,
      env: {
        ...process.env,
        NO_COLOR: '1',
        FORCE_COLOR: '0'
      },
      ...options
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      try {
        proc.kill('SIGKILL');
      } catch (e) {
        // ignore
      }
      reject(new Error(`Command timed out after ${TIMEOUT_MS}ms`));
    }, TIMEOUT_MS);

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(err);
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve({ code, stdout, stderr });
    });
  });
}

describe('Gemini CLI E2E', () => {
  if (SHOULD_RUN && !isGeminiAvailable()) {
    // Fail fast with a clear message when user explicitly requested E2E.
    throw new Error('Gemini CLI not found. Install @google/gemini-cli and ensure `gemini` is on PATH.');
  }

  runTest('responds to a simple prompt', async () => {
    const args = [
      '-p',
      'Reply with exactly "PONG".',
      '--output-format',
      'text',
      '--extensions',
      'none',
      '--model',
      MODEL
    ];

    const result = await runCommand('gemini', args);

    expect(result.code).toBe(0);
    const output = `${result.stdout}\n${result.stderr}`;
    expect(output).toMatch(/PONG/i);
  }, TIMEOUT_MS + 10000);
});
