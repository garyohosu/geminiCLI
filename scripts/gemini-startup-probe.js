/**
 * Gemini CLI startup / response probe
 *
 * Measures time from spawn -> first output -> exit.
 *
 * Usage:
 *   node scripts/gemini-startup-probe.js "Say OK"
 *
 * Env:
 *   GEMINI_PROBE_MODEL        (default: gemini-2.5-flash)
 *   GEMINI_PROBE_TIMEOUT_MS  (default: 180000)
 */

const { spawn } = require('child_process');

const prompt = process.argv.slice(2).join(' ') || 'Reply with exactly "OK".';
const model = process.env.GEMINI_PROBE_MODEL || 'gemini-2.5-flash';
const timeoutMs = Number(process.env.GEMINI_PROBE_TIMEOUT_MS || 180000);

const args = [
  '--output-format',
  'text',
  '--extensions',
  'none',
  '--model',
  model
];

const start = Date.now();
let spawnedAt = null;
let firstOutputAt = null;
let stdout = '';
let stderr = '';

function runOnce(label, inputPrompt) {
  return new Promise((resolve) => {
    const start = Date.now();
    let spawnedAt = null;
    let firstOutputAt = null;
    let stdout = '';
    let stderr = '';

    const proc = spawn('gemini', args, {
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
      resolve({
        label,
        code: 1,
        error: `Timeout after ${timeoutMs}ms`
      });
    }, timeoutMs);

    proc.on('spawn', () => {
      spawnedAt = Date.now();
      console.log(`[probe:${label}] spawned (pid=${proc.pid})`);
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

      resolve({
        label,
        code,
        model,
        promptLength: inputPrompt.length,
        spawnMs,
        firstOutputMs,
        totalMs,
        stdout,
        stderr
      });
    });

    // Send prompt via stdin to avoid quoting issues with shell on Windows.
    proc.stdin.write(`${inputPrompt}\n`);
    proc.stdin.end();
  });
}

function printResult(result) {
  if (result.error) {
    console.log(`[probe:${result.label}] error: ${result.error}`);
    return;
  }
  console.log(`[probe:${result.label}] exit code: ${result.code}`);
  console.log(`[probe:${result.label}] model: ${result.model}`);
  console.log(`[probe:${result.label}] prompt length: ${result.promptLength}`);
  console.log(`[probe:${result.label}] time: spawn=${result.spawnMs}ms firstOutput=${result.firstOutputMs}ms total=${result.totalMs}ms`);
  const combined = `${result.stdout}\n${result.stderr}`.trim();
  if (combined) {
    console.log(`[probe:${result.label}] --- output (first 300 chars) ---`);
    console.log(combined.slice(0, 300));
  }
}

async function main() {
  const first = await runOnce('run1', prompt);
  printResult(first);
  const second = await runOnce('run2', prompt);
  printResult(second);
  const exitCode = first.code === 0 && second.code === 0 ? 0 : 1;
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
