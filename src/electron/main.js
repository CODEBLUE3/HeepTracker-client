const { app, BrowserWindow, ipcMain } = require("electron");
const codeParser = require("../utils/codeParser");

let mainWindow;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow = win;
  win.loadURL("http://localhost:3000");
}

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Receive async message from renderer
// See file renderer.js on line 3
ipcMain.on("ping-good", (event) => {
  // It's so good because below have a delay 5s to execute, and this don't lock rendereder :)
  setTimeout(() => {
    console.log("GOOD finshed!");
    // Send reply to a renderer
    event.sender.send("ping-good-reply", "pong");
  }, 5000);
});

// Receive sync message from renderer
// See file renderer.js on line 18
ipcMain.on("ping-bad", (event) => {
  // It's so bad because below have a delay 5s to execute, meanwhile the renderer stay locked :(
  setTimeout(() => {
    console.log("BAD finshed!");
    event.returnValue = "pong";
  }, 5000);
});
