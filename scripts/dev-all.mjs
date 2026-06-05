import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const spawnOptions = {
  stdio: 'inherit',
};

const createSpawnConfig = (command, args) => {
  if (!isWindows) {
    return { command, args };
  }

  return {
    command: process.env.ComSpec || 'cmd.exe',
    args: ['/d', '/s', '/c', command, ...args],
  };
};

const processes = [
  {
    name: 'frontend',
    command: npmCommand,
    args: ['run', 'dev'],
  },
  {
    name: 'ai-api',
    command: npmCommand,
    args: ['run', 'dev:api'],
  },
];

const children = processes.map(({ name, command, args }) => {
  const spawnConfig = createSpawnConfig(command, args);
  const child = spawn(spawnConfig.command, spawnConfig.args, spawnOptions);

  child.on('error', (error) => {
    console.error(`[dev:all] failed to start ${name}: ${error.message}`);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[dev:all] ${name} stopped with signal ${signal}`);
    } else if (code !== 0) {
      console.log(`[dev:all] ${name} exited with code ${code}`);
    }
  });

  return child;
});

const stopAll = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
};

process.on('SIGINT', () => {
  stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopAll();
  process.exit(0);
});
