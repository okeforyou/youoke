const { app, Tray, Menu, dialog, nativeImage, shell, BrowserWindow } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
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
      method: 'GET',
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      headers: { 'User-Agent': 'YouOke-Plugin/1.0' },
      timeout: 4000
    };

    const req = client.request(options, (res) => {
      res.resume(); // Consume response data to free socket
      const isOk = res.statusCode >= 200 && res.statusCode < 400;
      done(isOk);
      req.destroy(); // Close connection immediately
    });

    req.on('error', () => {
      done(false);
    });

    req.on('timeout', () => {
      req.destroy();
      done(false);
    });

    req.end();
  } catch (e) {
    done(false);
  }
}

let tray = null;
let serverProcess = null;
let dashboardWindow = null;

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log("Another instance of YouOke Plugin is already running. Quitting this instance.");
  app.exit(0);
} else {
  app.on('second-instance', () => {
    // If user tries to run a second instance, focus or open the dashboard
    createDashboardWindow();
  });
}

function createDashboardWindow() {
  if (dashboardWindow) {
    if (dashboardWindow.isMinimized()) {
      dashboardWindow.restore();
    }
    dashboardWindow.show();
    dashboardWindow.focus();
    return;
  }

  if (app.dock) app.dock.show();

  dashboardWindow = new BrowserWindow({
    width: 820,
    height: 600,
    minWidth: 380,
    minHeight: 500,
    resizable: true,
    maximizable: false,
    backgroundColor: '#09090b',
    title: "YouOke AI Dashboard",
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const primaryUrl = app.isPackaged 
    ? 'https://play.okeforyou.com/plugin-dashboard'
    : 'http://localhost:3000/plugin-dashboard';

  const backupUrl = 'https://youoke.vercel.app/plugin-dashboard';

  checkUrlStatus(primaryUrl, (primaryOk) => {
    if (primaryOk) {
      console.log('Loading primary URL:', primaryUrl);
      dashboardWindow.loadURL(primaryUrl).catch(() => {
        dashboardWindow.loadFile(path.join(__dirname, 'offline.html'));
      });
    } else {
      console.warn('Primary URL failed or returned non-200. Checking backup URL:', backupUrl);
      checkUrlStatus(backupUrl, (backupOk) => {
        if (backupOk) {
          console.log('Loading backup URL:', backupUrl);
          dashboardWindow.loadURL(backupUrl).catch(() => {
            dashboardWindow.loadFile(path.join(__dirname, 'offline.html'));
          });
        } else {
          console.error('Both primary and backup URLs are unavailable. Loading local offline dashboard.');
          dashboardWindow.loadFile(path.join(__dirname, 'offline.html'));
        }
      });
    }
  });

  dashboardWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    if (errorCode !== -3) { // Ignore ERR_ABORTED
      console.error(`Navigation failed to ${validatedURL}: ${errorDescription} (${errorCode})`);
      dashboardWindow.loadFile(path.join(__dirname, 'offline.html'));
    }
  });

  // Open external links in default browser
  dashboardWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  dashboardWindow.on('closed', () => {
    dashboardWindow = null;
    if (app.dock) app.dock.hide();
  });
}

// Determine the path to the bundled Python executable
function getServerExecutablePath() {
  const isWin = process.platform === 'win32';
  const executableName = isWin ? 'youoke-server.exe' : 'youoke-server';
  
  // When running via `npm start`, it's in the bin/ folder.
  // When packaged by electron-builder, it will be in process.resourcesPath/bin/
  let devPath = path.join(__dirname, 'bin', executableName);
  let prodPath = path.join(process.resourcesPath, 'bin', executableName);
  
  if (fs.existsSync(prodPath)) {
    return prodPath;
  }
  return devPath;
}

function killExistingServer(callback) {
  const isWin = process.platform === 'win32';
  
  // 1. Kill by process name
  const killByName = isWin ? 'taskkill /F /IM youoke-server.exe /T 2>nul' : 'pkill -9 -f youoke-server 2>/dev/null || true';
  
  // 2. Kill whatever is holding port 5050
  const killByPort = isWin 
    ? 'for /f "tokens=5" %a in (\'netstat -aon ^| find ":5050" ^| find "LISTENING"\') do taskkill /F /PID %a /T 2>nul'
    : 'lsof -ti:5050 | xargs kill -9 2>/dev/null || true';

  // Run them sequentially and ignore errors
  exec(killByName, () => {
    exec(killByPort, () => {
      if (typeof callback === 'function') {
        callback();
      }
    });
  });
}

function startServer() {
  if (serverProcess) {
    console.log("Server is already running.");
    return;
  }

  const serverPath = getServerExecutablePath();
  if (!fs.existsSync(serverPath)) {
    console.error(`Server executable not found at: ${serverPath}`);
    return;
  }

  // Kill any running zombies first
  killExistingServer(() => {
    console.log(`Starting server: ${serverPath}`);
    
    // Make sure it's executable on Mac/Linux
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(serverPath, 0o755);
      } catch (e) {
        console.error("Could not set executable permissions:", e);
      }
    }

    const logDir = app.getPath('userData');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'server.log');
    console.log(`Logging server output to: ${logFile}`);
    
    let logFd;
    try {
      logFd = fs.openSync(logFile, 'a');
      fs.writeSync(logFd, `\n\n--- SERVER START: ${new Date().toISOString()} ---\n\n`);
    } catch (e) {
      console.error("Failed to open server log file:", e);
      logFd = 'ignore';
    }

    serverProcess = spawn(serverPath, [], {
      stdio: ['ignore', logFd, logFd],
      detached: false,
      env: { ...process.env, PYTHONUNBUFFERED: "1" } // Flush Python logs instantly
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      serverProcess = null;
    });
  });
}

function stopServer(callback) {
  if (serverProcess) {
    try {
      if (process.platform === 'win32') {
        exec(`taskkill /pid ${serverProcess.pid} /T /F 2>nul`);
      } else {
        serverProcess.kill('SIGKILL');
      }
    } catch (e) {}
    serverProcess = null;
    console.log("Server stopped.");
  }
  killExistingServer(callback);
}

app.whenReady().then(() => {
  // We don't want a dock icon on macOS for a tray-only app
  if (app.dock) app.dock.hide();

  // Register custom protocol for seamless web launch
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('youoke', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('youoke');
  }

  // Set Auto-Start on Boot so it's always ready
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true
  });

  // Use the actual YouOke icon for the tray
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  let icon;
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
    // Resize icon for tray if it's too large (standard size is 16x16 or 24x24)
    icon = icon.resize({ width: 20, height: 20 });
  } else {
    // Create a 16x16 transparent image if no icon exists
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  // Remove the text title so it only shows the icon
  tray.setTitle('');
  tray.setToolTip('YouOke Local AI Bridge');

  const appVersion = app.getVersion();

  const contextMenu = Menu.buildFromTemplate([
    { label: `YouOke Plugin v${appVersion}`, enabled: false },
    { type: 'separator' },
    { label: 'เปิดแดชบอร์ดจัดการ (Dashboard)...', click: () => { createDashboardWindow(); } },
    { type: 'separator' },
    { label: 'รีสตาร์ทระบบ AI', click: () => { stopServer(() => { setTimeout(startServer, 1000); }); } },
    { label: 'ตรวจสอบอัปเดต', click: () => { autoUpdater.checkForUpdatesAndNotify(); } },
    { type: 'separator' },
    { 
      label: 'ปิดโปรแกรม', 
      click: () => { 
        stopServer(() => {
          app.exit(0);
        });
      } 
    }
  ]);
  
  tray.setContextMenu(contextMenu);

  // Open dashboard window on double click
  tray.on('double-click', () => {
    createDashboardWindow();
  });

  // Auto updater config
  // Point to our Vercel API proxy so it can securely access private GitHub releases!
  autoUpdater.autoDownload = false;
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://youoke.vercel.app/api/updates'
  });

  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'มีอัปเดตใหม่ YouOke Plugin!',
      message: `พบเวอร์ชันใหม่ (${info.version})\n\nเพื่อป้องกันปัญหาไฟล์ค้างในเครื่องและลงทับไม่ผ่าน:\nระบบจะเปิดหน้าดาวน์โหลด และปิด YouOke Plugin อัตโนมัติทันที เพื่อให้คุณติดตั้งไฟล์ใหม่ทับได้ทันทีโดยไม่ติดขัดครับ`,
      buttons: ['ดาวน์โหลดและปิดโปรแกรมเดิม', 'ไว้ทีหลัง']
    }).then((result) => {
      if (result.response === 0) {
        const downloadUrl = process.platform === 'darwin' 
          ? 'https://youoke.vercel.app/api/download-plugin?os=mac'
          : 'https://youoke.vercel.app/api/download-plugin?os=win';
        shell.openExternal(downloadUrl);
        // Force-kill server and exit process immediately so files are released
        stopServer(() => {
          setTimeout(() => {
            app.exit(0);
          }, 300);
        });
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.error("AutoUpdater error: ", err);
  });

  // Start server automatically
  startServer();
  
  // Check for updates on startup
  autoUpdater.checkForUpdatesAndNotify();
});

// Clean up before quitting
app.on('will-quit', () => {
  stopServer();
});

// Prevent window-all-closed from quitting (it's a tray app)
app.on('window-all-closed', () => {
  // Do nothing
});
