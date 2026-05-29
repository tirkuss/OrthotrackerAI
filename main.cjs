const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "OrthoTracker",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
  });

  // Remove administrative top menu bar for a clean design look unless in development
  const isDev = process.env.NODE_ENV === 'development';
  if (!isDev) {
    win.setMenu(null);
  }

  // Load the built production app from the 'dist' directory
  win.loadFile(path.join(__dirname, 'dist', 'index.html'))
    .catch((err) => {
      console.error("Failed to load index.html:", err);
    });

  // Open the DevTools in local development mode for quick debugging
  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
