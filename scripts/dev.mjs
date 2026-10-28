import { spawn } from 'node:child_process';
const children = [
  spawn(process.execPath, ['scripts/fixture-server.mjs'], { stdio: 'inherit' }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'vite.config.ts'], {
    stdio: 'inherit',
  }),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(code), 300).unref();
}
for (const child of children) {
  child.on('error', () => stop(1));
  child.on('exit', (code) => {
    if (!stopping) stop(code || 1);
  });
}
process.once('SIGTERM', () => stop());
process.once('SIGINT', () => stop());
