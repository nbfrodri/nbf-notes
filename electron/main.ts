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
      color: "#050a14", // Deep Midnight Navy
      symbolColor: "#00ffff", // Cyan
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

ipcMain.handle("save-note", async (_event, noteId: string, content: string) => {
  const userDataPath = app.getPath("userData");
  const notesDir = path.join(userDataPath, "notes");
  await fs.mkdir(notesDir, { recursive: true });
  const filePath = path.join(notesDir, `${noteId}.json`);
  await fs.writeFile(filePath, content, "utf-8");
  return true;
});

ipcMain.handle("delete-note", async (_event, noteId: string) => {
  const userDataPath = app.getPath("userData");
  const filePath = path.join(userDataPath, "notes", `${noteId}.json`);
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Failed to delete note ${noteId}:`, error);
    return false;
  }
});

ipcMain.handle("load-notes", async () => {
  const userDataPath = app.getPath("userData");
  const notesDir = path.join(userDataPath, "notes");
  try {
    await fs.mkdir(notesDir, { recursive: true });
    const files = await fs.readdir(notesDir);
    const notes = [];
    for (const file of files) {
      if (file.endsWith(".json")) {
        const content = await fs.readFile(path.join(notesDir, file), "utf-8");
        try {
          notes.push(JSON.parse(content));
        } catch (e) {
          console.error(`Failed to parse note ${file}:`, e);
        }
      }
    }
    return notes;
  } catch (error) {
    console.error("Failed to load notes:", error);
    return [];
  }
});

ipcMain.handle("delete-image", async (_event, fileName: string) => {
  const userDataPath = app.getPath("userData");
  // Security check: ensure fileName doesn't contain crazy paths
  const safeName = path.basename(fileName);
  const filePath = path.join(userDataPath, "images", safeName);
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    // Info level because might already be gone
    console.info(`Failed to delete image ${safeName}:`, error);
    return false;
  }
});

ipcMain.handle("get-all-images", async () => {
  const userDataPath = app.getPath("userData");
  const imagesDir = path.join(userDataPath, "images");
  try {
    await fs.mkdir(imagesDir, { recursive: true });
    return await fs.readdir(imagesDir);
  } catch (error) {
    console.error("Failed to list images:", error);
    return [];
  }
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
  console.log("App UserData Path:", app.getPath("userData"));
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
