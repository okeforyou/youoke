const { spawn } = require('child_process');
const path = require('path');

// Get port from environment or use default
const port = process.env.PORT || 3000;

// Path to Next.js binary
const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');

console.log('Starting Next.js application...');
console.log('Port:', port);
console.log('Directory:', __dirname);

// Start Next.js in development mode
const child = spawn(nextBin, ['dev', '-p', port], {
  stdio: 'inherit',
  cwd: __dirname,
  env: process.env
});

child.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  console.log(`Next.js exited with code ${code}`);
  process.exit(code || 0);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  child.kill('SIGINT');
});
