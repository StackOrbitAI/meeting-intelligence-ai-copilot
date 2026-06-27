const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Set environment to development
process.env.NODE_ENV = 'development';

// Helper to log with prefix
function log(prefix, data) {
  const text = data.toString().trim();
  if (!text) return;
  console.log(`[${prefix}] ${text}`);
}

const vitePath = path.resolve(__dirname, '../node_modules/vite/bin/vite.js');
const tsupPath = path.resolve(__dirname, '../node_modules/tsup/dist/cli-default.js');
const electronCliPath = path.resolve(__dirname, '../node_modules/electron/cli.js');
const distFile = path.resolve(__dirname, '../dist/main/index.js');
const distDir = path.dirname(distFile);

// 1. Start Vite dev server for the React frontend
const vite = spawn('node', [vitePath], {
  stdio: 'pipe'
});

vite.stdout.on('data', (data) => log('Vite', data));
vite.stderr.on('data', (data) => log('Vite-Error', data));

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

let electronProcess = null;

function startElectron() {
  if (electronProcess) {
    try {
      electronProcess.kill('SIGTERM');
    } catch (e) {}
  }

  console.log('[Dev] Starting Electron application...');
  electronProcess = spawn('node', [electronCliPath, '.'], {
    stdio: 'inherit'
  });

  electronProcess.on('close', (code) => {
    if (code !== null) {
      console.log(`[Dev] Electron process exited (code: ${code})`);
    }
  });
}

// 2. Start tsup watch compilation (without onSuccess, we handle it ourselves!)
console.log('[Dev] Starting main process compilation in watch mode...');
const tsup = spawn('node', [
  tsupPath,
  'src/main/index.ts',
  'src/main/preload.ts',
  '--out-dir',
  'dist/main',
  '--format',
  'cjs',
  '--external',
  'electron',
  '--watch'
], {
  stdio: 'inherit'
});

// 3. Watch the output file to start/restart Electron when compiled
let debounceTimeout = null;
let hasStarted = false;

// If build already exists on start, launch it
if (fs.existsSync(distFile)) {
  setTimeout(() => {
    startElectron();
    hasStarted = true;
  }, 1000);
}

fs.watch(distDir, (eventType, filename) => {
  if (filename === 'index.js') {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      console.log('[Dev] Build update detected. Booting/Restarting Electron...');
      startElectron();
      hasStarted = true;
    }, 400);
  }
});

process.on('SIGINT', () => {
  if (electronProcess) electronProcess.kill();
  tsup.kill();
  vite.kill();
  process.exit(0);
});

process.on('exit', () => {
  if (electronProcess) electronProcess.kill();
  tsup.kill();
  vite.kill();
});
