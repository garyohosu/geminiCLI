/**
 * Simple child process that reads one line from stdin and responds.
 *
 * Usage: node scripts/ipc-echo-child.js
 */

process.stdin.setEncoding('utf8');

let buffer = '';
const MAX_LEN = 1024;

const respondAndExit = (input) => {
  const trimmed = input.trim();
  const reversed = trimmed.split('').reverse().join('');
  process.stdout.write(`ACK:${reversed}\n`);
  process.exit(0);
};

process.stdin.on('data', (chunk) => {
  buffer += chunk;

  if (buffer.length > MAX_LEN) {
    process.stderr.write('Input too long\n');
    process.exit(1);
  }

  if (buffer.includes('\n')) {
    respondAndExit(buffer);
  }
});

process.stdin.on('end', () => {
  if (buffer.trim().length > 0) {
    respondAndExit(buffer);
  } else {
    process.stderr.write('No input received\n');
    process.exit(1);
  }
});
