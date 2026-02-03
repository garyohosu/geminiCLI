/**
 * Gemini CLI version probe
 *
 * Measures time from spawn -> first output -> exit for `gemini --version`.
 *
 * Usage:
 *   node scripts/gemini-version-probe.js
 *
 * Env:
 *   GEMINI_VERSION_TIMEOUT_MS (default: 30000)
 */

const { spawn } = require('child_process');

const timeoutMs = Number(process.env.GEMINI_VERSION_TIMEOUT_MS || 30000);

const start = Date.now();
let spawnedAt = null;
let firstOutputAt = null;
let stdout = '';
let stderr = '';

const proc = spawn('gemini', ['--version'], {
  shell: true,
  windowsHide: true,
  env: {
    ...process.env,
    NO_COLOR: '1',
    FORCE_COLOR: '0'
  }
});

const timeoutId = setTimeout(() => {
  try {
    proc.kill('SIGKILL');
  } catch (e) {
    // ignore
  }
  console.error(`Timeout after ${timeoutMs}ms`);
  process.exit(1);
}, timeoutMs);

proc.on('spawn', () => {
  spawnedAt = Date.now();
  console.log(`[version] spawned (pid=${proc.pid})`);
});

const markFirstOutput = () => {
  if (!firstOutputAt) {
    firstOutputAt = Date.now();
  }
};

proc.stdout.on('data', (data) => {
  markFirstOutput();
  stdout += data.toString();
});

proc.stderr.on('data', (data) => {
  markFirstOutput();
  stderr += data.toString();
});

proc.on('close', (code) => {
  clearTimeout(timeoutId);
  const end = Date.now();
  const spawnMs = spawnedAt ? spawnedAt - start : null;
  const firstOutputMs = firstOutputAt ? firstOutputAt - start : null;
  const totalMs = end - start;

  console.log(`[version] exit code: ${code}`);
  console.log(`[version] time: spawn=${spawnMs}ms firstOutput=${firstOutputMs}ms total=${totalMs}ms`);

  const combined = `${stdout}\n${stderr}`.trim();
  if (combined) {
    console.log('--- output ---');
    console.log(combined);
  }

  process.exit(code ?? 1);
});
