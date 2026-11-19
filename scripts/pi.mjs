import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = ['--extension', join(root, 'extensions/goldilocks.ts'), '--skill', join(root, 'skills/goldilocks'),
  '--provider', 'openai-codex', '--model', 'gpt-6.1-sol', '--thinking', 'high', ...process.argv.slice(2)];
const child = spawn('pi', args, { stdio: 'inherit', shell: false, env: process.env });
child.on('error', e => { console.error(`Cannot launch Pi: ${e.message}`); process.exitCode = 1; });
child.on('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
