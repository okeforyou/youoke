const { app, Tray, Menu, dialog, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

let tray = null;
let serverProcess = null;

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
  const killCmd = isWin ? 'taskkill /F /IM youoke-server.exe /T' : 'killall -9 youoke-server';
  exec(killCmd, (err) => {
    // Ignore errors, call the callback when done
    callback();
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

function stopServer() {
  if (serverProcess) {
    serverProcess.kill('SIGINT');
    serverProcess = null;
    console.log("Server stopped.");
  }
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
    { label: 'ระบบจัดการ YouOke AI', enabled: false },
    { type: 'separator' },
    { label: 'รีสตาร์ทระบบ AI', click: () => { stopServer(); setTimeout(startServer, 1000); } },
    { label: 'ตรวจสอบอัปเดต', click: () => { autoUpdater.checkForUpdatesAndNotify(); } },
    { type: 'separator' },
    { label: 'ปิดโปรแกรม', click: () => { stopServer(); app.quit(); } }
  ]);
  
  tray.setContextMenu(contextMenu);

  // Auto updater config
  // Point to our Vercel API proxy so it can securely access private GitHub releases!
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: 'https://youoke.vercel.app/api/updates'
  });

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'มีอัปเดตใหม่!',
      message: 'ตรวจพบเวอร์ชันใหม่ล่าสุด กำลังดาวน์โหลดอัปเดตอยู่เบื้องหลัง...'
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'ดาวน์โหลดอัปเดตเสร็จสิ้น',
      message: 'ระบบพร้อมสำหรับการอัปเดตแล้ว กรุณากด "รีสตาร์ทตอนนี้" เพื่อทำการติดตั้งอัตโนมัติ',
      buttons: ['รีสตาร์ทตอนนี้', 'ไว้ทีหลัง']
    }).then((result) => {
      if (result.response === 0) {
        stopServer();
        autoUpdater.quitAndInstall();
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
