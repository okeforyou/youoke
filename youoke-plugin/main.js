const { app, Tray, Menu, dialog, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawn } = require('child_process');
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

  console.log(`Starting server: ${serverPath}`);
  
  // Make sure it's executable on Mac/Linux
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(serverPath, 0o755);
    } catch (e) {
      console.error("Could not set executable permissions:", e);
    }
  }

  serverProcess = spawn(serverPath, [], {
    stdio: 'ignore', // Do not show terminal output to keep it invisible
    detached: false
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    serverProcess = null;
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

  // Create an empty native image for the tray icon MVP (or use a real icon later)
  // Electron requires some image for the tray
  const iconPath = path.join(__dirname, 'assets', 'iconTemplate.png');
  let icon;
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  } else {
    // Create a 16x16 transparent image if no icon exists
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setTitle('🎙️');
  tray.setToolTip('YouOke Local AI Bridge');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'YouOke AI Plugin', enabled: false },
    { type: 'separator' },
    { label: 'Restart Server', click: () => { stopServer(); setTimeout(startServer, 1000); } },
    { label: 'Check for Updates', click: () => { autoUpdater.checkForUpdatesAndNotify(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { stopServer(); app.quit(); } }
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
      title: 'Update Available',
      message: 'A new version of YouOke AI Plugin is available. Downloading now...'
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The plugin will restart to install the update.',
      buttons: ['Restart Now', 'Later']
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
