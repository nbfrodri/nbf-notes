import { app, BrowserWindow, ipcMain, protocol, net } from "electron";
import { pathToFileURL } from "node:url";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// CommonJS/TS hybrid handling: in a compiled CJS file, __dirname is available.
// We don't need import.meta.url stuff.

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// eslint-disable-next-line @typescript-eslint/no-var-requires
if (require("electron-squirrel-startup")) {
  app.quit();
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#0f172a",
      symbolColor: "#ffffff",
    },
    icon: app.isPackaged
      ? path.join(__dirname, "../dist/icon.png")
      : path.join(__dirname, "../public/icon.png"),
    backgroundColor: "#0f172a", // Prevent white flash
  });

  // Load the app
  const devUrl = "http://localhost:5173";

  if (!app.isPackaged) {
    mainWindow.loadURL(devUrl).catch((err) => {
      console.error("Failed to load dev URL:", err);
    });
    // Open DevTools in development
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

// IPC Handlers
ipcMain.handle("save-image", async (_event, arrayBuffer: ArrayBuffer) => {
  const buffer = Buffer.from(arrayBuffer);
  const fileName = `${crypto.randomUUID()}.png`;
  const userDataPath = app.getPath("userData");
  const imagesDir = path.join(userDataPath, "images");

  await fs.mkdir(imagesDir, { recursive: true });
  const filePath = path.join(imagesDir, fileName);
  await fs.writeFile(filePath, buffer);

  // Return media:// URL
  return `media://${fileName}`;
});

// Register scheme as privileged
protocol.registerSchemesAsPrivileged([
  {
    scheme: "media",
    privileges: {
      secure: true,
      supportFetchAPI: true,
      standard: true,
      bypassCSP: true,
      stream: true,
    },
  },
]);

app.whenReady().then(() => {
  // Register 'media' protocol to serve files from userData/images
  // Register 'media' protocol to serve files from userData/images
  protocol.handle("media", (request) => {
    try {
      // request.url is "media://<filename>/" or "media://<filename>"
      // Regex to capture the content between media:// and the next slash (or end of string)
      // This ignores any trailing slashes automatically.
      const match = request.url.match(/^media:\/\/([^/]+)/);

      if (!match || !match[1]) {
        throw new Error("Invalid media URL format");
      }

      const fileName = decodeURIComponent(match[1]);
      const userDataPath = app.getPath("userData");
      const filePath = path.join(userDataPath, "images", fileName);
      const fileUrl = pathToFileURL(filePath).toString();

      console.log("Serving media:", request.url, "->", filePath);
      return net.fetch(fileUrl);
    } catch (e: any) {
      console.error("Failed to handle media protocol:", e);
      return new Response("Bad Request: " + e.message, { status: 400 });
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
