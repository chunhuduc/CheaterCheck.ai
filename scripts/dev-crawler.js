#!/usr/bin/env node
/**
 * Helper script to run crawler in dev mode with environment variables.
 * Cross-platform compatible (Windows, Linux, Mac).
 */
const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.HARPERDB_URL = process.env.HARPERDB_URL || 'http://localhost:9925';
process.env.HARPERDB_USERNAME = process.env.HARPERDB_USERNAME || 'HDB_ADMIN';
process.env.HARPERDB_PASSWORD = process.env.HARPERDB_PASSWORD || 'changeme';
process.env.HARPERDB_SCHEMA = process.env.HARPERDB_SCHEMA || 'cheatercheck';

// Check if CRAWL_INTERVAL is set to 0 (run once mode)
const runOnce = process.argv.includes('--once') || process.env.CRAWL_INTERVAL === '0';
if (runOnce) {
  process.env.CRAWL_INTERVAL = '0';
}

const crawlerDir = path.resolve(__dirname, '..', 'crawler');
const pythonScript = path.join(crawlerDir, 'main.py');

console.log('Starting Tinder crawler in dev mode...');
console.log(`HARPERDB_URL: ${process.env.HARPERDB_URL}`);
console.log(`Crawler directory: ${crawlerDir}`);
console.log('');

// Determine Python command
// On Windows, try 'py' first (Python Launcher), then 'python', then 'python3'
// On Unix, try 'python3' first, then 'python'
let pythonCmd;
if (process.platform === 'win32') {
  pythonCmd = 'py';  // Windows Python Launcher
} else {
  pythonCmd = 'python3';
}

// Change to crawler directory and run Python script
const child = spawn(pythonCmd, ['main.py'], {
  cwd: crawlerDir,
  env: process.env,
  stdio: 'inherit',
  shell: true
});

child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    // Try fallback commands
    if (process.platform === 'win32' && pythonCmd === 'py') {
      console.error(`'py' not found, trying 'python'...`);
      const fallbackChild = spawn('python', ['main.py'], {
        cwd: crawlerDir,
        env: process.env,
        stdio: 'inherit',
        shell: true
      });
      
      fallbackChild.on('error', (fallbackErr) => {
        console.error(`\nPython not found. Tried 'py' and 'python'.`);
        console.error('Please install Python and ensure one of these commands is in your PATH.');
        console.error('On Windows, Python Launcher (py) is usually available after installing Python from python.org');
        process.exit(1);
      });
      
      fallbackChild.on('exit', (code) => {
        process.exit(code || 0);
      });
      return;
    }
    console.error(`\nPython not found. Please install Python and ensure '${pythonCmd}' is in your PATH.`);
    process.exit(1);
  } else {
    console.error('Failed to start crawler:', err.message);
    process.exit(1);
  }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

