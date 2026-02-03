/**
 * Simple parent process that spawns ipc-echo-child.js and validates the response.
 *
 * Usage: node scripts/ipc-echo-parent.js "hello world"
 */

const { spawn } = require('child_process');
const path = require('path');

const childPath = path.join(__dirname, 'ipc-echo-child.js');
const input = process.argv.slice(2).join(' ') || 'ping';

const child = spawn(process.execPath, [childPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  windowsHide: true
});

let stdout = '';
let stderr = '';

const timeoutMs = 5000;
const timeoutId = setTimeout(() => {
  try {
    child.kill('SIGKILL');
  } catch (e) {
    // ignore
  }
  console.error(`Timeout after ${timeoutMs}ms`);
  process.exit(1);
}, timeoutMs);

child.stdout.on('data', (data) => {
  stdout += data.toString();
});

child.stderr.on('data', (data) => {
  stderr += data.toString();
});

child.on('close', (code) => {
  clearTimeout(timeoutId);
  const trimmed = stdout.trim();
  console.log(`child exit code: ${code}`);
  console.log(`stdout: ${trimmed}`);
  if (stderr.trim()) {
    console.error(`stderr: ${stderr.trim()}`);
  }
  process.exit(code);
});

child.stdin.write(`${input}\n`);
child.stdin.end();
