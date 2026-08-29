const https = require('https');
const http = require('http');

function checkUrlStatus(url, callback) {
  let called = false;
  const done = (val) => {
    if (!called) {
      called = true;
      callback(val);
    }
  };

  try {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    const options = {
      method: 'HEAD',
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      timeout: 3000
    };

    const req = client.request(options, (res) => {
      res.resume(); // Consume data
      console.log(`URL: ${url} -> Status: ${res.statusCode}`);
      done(res.statusCode === 200);
      req.destroy(); // Destroy request
    });

    req.on('error', (err) => {
      console.error(`URL: ${url} -> Error:`, err.message);
      done(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error(`URL: ${url} -> Timeout`);
      done(false);
    });

    req.end();
  } catch (e) {
    console.error("Catch error:", e);
    done(false);
  }
}

checkUrlStatus('https://play.okeforyou.com/plugin-dashboard', (ok) => {
  console.log('play.okeforyou.com ok?', ok);
});

checkUrlStatus('https://youoke.vercel.app/plugin-dashboard', (ok) => {
  console.log('youoke.vercel.app ok?', ok);
});
