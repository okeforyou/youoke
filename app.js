const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Node.js Test</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .card {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #22c55e; }
        .info { margin: 10px 0; padding: 10px; background: #f0f9ff; border-left: 4px solid #3b82f6; }
        .success { color: #22c55e; font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>✅ Node.js ทำงานแล้ว!</h1>
        <p class="success">🎉 Server is running successfully!</p>
        <div class="info"><strong>Port:</strong> ${port}</div>
        <div class="info"><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</div>
        <div class="info"><strong>Node Version:</strong> ${process.version}</div>
        <div class="info"><strong>Directory:</strong> ${__dirname}</div>
        <div class="info"><strong>Platform:</strong> ${process.platform}</div>
        <div class="info"><strong>Time:</strong> ${new Date().toLocaleString('th-TH')}</div>
        <hr>
        <p><strong>✅ ผลการทดสอบ:</strong></p>
        <ul>
          <li>✅ Node.js process กำลังทำงาน</li>
          <li>✅ HTTP server ตอบกลับได้</li>
          <li>✅ Proxy configuration ถูกต้อง</li>
          <li>✅ พร้อมใช้งาน Next.js แล้ว!</li>
        </ul>
        <p style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 5px;">
          <strong>📝 ขั้นตอนต่อไป:</strong><br>
          กลับไปที่ Plesk → Node.js Dashboard<br>
          เปลี่ยน Application Startup File เป็น: <code>play.okeforyou.com/server.js</code><br>
          แล้ว Restart App อีกครั้ง
        </p>
      </div>
    </body>
    </html>
  `);
});

server.listen(port, () => {
  console.log(`✅ Test server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Directory: ${__dirname}`);
});

// Handle errors
server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
