// test-api.js
require('dotenv').config({ path: '.env.local' });
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = true;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3001, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3001');
    
    // Trigger the API automatically once the server is up
    console.log('Triggering API route...');
    import('node-fetch').then(({default: fetch}) => {
        fetch('http://localhost:3001/api/cron/update-cache?key=dev_secret_key_for_local_testing')
            .then(r => r.json())
            .then(data => {
                console.log('API Result:', data);
                process.exit(0);
            })
            .catch(e => {
                console.error('API Trigger Error:', e);
                process.exit(1);
            });
    });
  });
});
