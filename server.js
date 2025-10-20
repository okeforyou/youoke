#!/usr/bin/env node

// Production-ready server.js for Plesk Node.js hosting
// Supports both development and production modes

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

console.log('=================================');
console.log('Starting Next.js application...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Mode:', dev ? 'Development' : 'Production');
console.log('Port:', port);
console.log('Hostname:', hostname);
console.log('=================================');

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }).listen(port, hostname, (err) => {
      if (err) throw err;
      console.log(`✅ Next.js server ready on http://${hostname}:${port}`);
      console.log(`✅ Application mode: ${dev ? 'Development' : 'Production'}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start Next.js:', err);
    process.exit(1);
  });

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
