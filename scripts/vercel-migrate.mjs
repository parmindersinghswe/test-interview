#!/usr/bin/env node
import { spawn } from 'node:child_process';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('Skipping drizzle-kit push because DATABASE_URL is not set.');
  process.exit(0);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const child = spawn(npmCommand, ['run', 'db:push'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`vercel:migrate terminated due to signal ${signal}`);
    process.exit(1);
  }

  process.exit(code ?? 0);
});
