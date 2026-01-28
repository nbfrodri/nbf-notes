import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Capacitor } from "@capacitor/core";

export interface StorageService {
  saveImage(buffer: ArrayBuffer): Promise<string>;
  saveNote(note: any): Promise<boolean>;
  deleteNote(id: string): Promise<boolean>;
  loadNotes(): Promise<any[]>;
  deleteNote(id: string): Promise<boolean>;
  loadNotes(): Promise<any[]>;
  deleteImage(fileName: string): Promise<boolean>;
  getAllImages(): Promise<string[]>;
  getImageUrl(fileName: string): Promise<string>;
  platform: "electron" | "web" | "ios" | "android";
}

class StorageServiceImpl implements StorageService {
  get platform() {
    // Check if running in Electron
    if (window.electronAPI) {
      return "electron";
    }
    // Check Capacitor platform
    return Capacitor.getPlatform() as "web" | "ios" | "android";
  }

  async saveImage(buffer: ArrayBuffer): Promise<string> {
    if (this.platform === "electron") {
      // Electron implementation returns the raw filename now, meant to be used with getImageUrl
      // For backward compatibility during transition or just cleaner storage, we store UUID.png
      // The electronAPI.saveImage usually returned media://... we need to check that.
      // Actually, looking at main.ts, it returns `media://${fileName}`.
      // we want to extract just the filename from it if possible, OR
      // we should update electron/main.ts to just return filename?
      // For minimal perturbation, let's just strip the media:// prefix here or
      // handle it.
      // But wait, the plan said "Modify saveImage: Change return type... return filename".
      // electronAPI.saveImage returns string.
      const fullUrl = await window.electronAPI.saveImage(buffer);
      // Extract filename
      return fullUrl.replace("media://", "");
    }

    // Capacitor (Mobile) implementation
    try {
      // Convert buffer to base64 for Capacitor Filesystem
      const base64String = this.arrayBufferToBase64(buffer);
      const fileName = `${crypto.randomUUID()}.png`;

      // No need to create directory for root (it exists)

      await Filesystem.writeFile({
        path: fileName,
        data: base64String,
        directory: Directory.Data,
      });

      // VERIFY WRITE IMMEDIATELY (Silently)
      await Filesystem.stat({
        path: fileName,
        directory: Directory.Data,
      });

      // Return just the filename for storage
      return fileName;
    } catch (error: any) {
      console.error("StorageService: Failed to save image", error);
      throw error;
    }
  }

  async saveNote(note: any): Promise<boolean> {
    if (this.platform === "electron") {
      return await window.electronAPI.saveNote(
        note.id,
        JSON.stringify(note, null, 2),
      );
    }

    // Mobile Implementation
    try {
      // Ensure directory exists
      try {
        await Filesystem.mkdir({
          path: "notes",
          directory: Directory.Data,
          recursive: true,
        });
      } catch {
        // Ignore if exists
      }

      await Filesystem.writeFile({
        path: `notes/${note.id}.json`,
        data: JSON.stringify(note, null, 2),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return true;
    } catch (e) {
      console.error("Failed to save note mobile:", e);
      return false;
    }
  }

  async deleteNote(id: string): Promise<boolean> {
    if (this.platform === "electron") {
      return await window.electronAPI.deleteNote(id);
    }

    // Mobile Implementation
    try {
      await Filesystem.deleteFile({
        path: `notes/${id}.json`,
        directory: Directory.Data,
      });
      return true;
    } catch (e) {
      console.error("Failed to delete note mobile:", e);
      return false;
    }
  }

  async loadNotes(): Promise<any[]> {
    if (this.platform === "electron") {
      return await window.electronAPI.loadNotes();
    }

    // Mobile Implementation
    try {
      // Ensure directory exists
      try {
        await Filesystem.mkdir({
          path: "notes",
          directory: Directory.Data,
          recursive: true,
        });
      } catch {
        // Ignore if exists
      }

      const result = await Filesystem.readdir({
        path: "notes",
        directory: Directory.Data,
      });

      const notes = [];
      for (const file of result.files) {
        // Filesystem readdir returns FileInfo objects or strings depending on version/web
        // Assuming string filenames or checking name property.
        // Capacitor 6/Plugin 6 returns objects typically.
        // Let's handle generic case. Checks simple filename match or object name.
        const name = typeof file === "string" ? file : file.name;

        if (name.endsWith(".json")) {
          const content = await Filesystem.readFile({
            path: `notes/${name}`,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
          });
          try {
            if (typeof content.data === "string") {
              notes.push(JSON.parse(content.data));
            }
          } catch (e) {
            console.error("Failed to parse note:", name, e);
          }
        }
      }
      return notes;
    } catch (e) {
      console.error("Failed to load notes mobile:", e);
      return [];
    }
  }

  async deleteImage(fileName: string): Promise<boolean> {
    if (this.platform === "electron") {
      // Extract filename if it's a full URL
      const name = fileName.replace("media://", "");
      return await window.electronAPI.deleteImage(name);
    }

    // Mobile
    try {
      // Extract filename safely.
      let cleanName = fileName;
      if (fileName.includes("/")) {
        cleanName = fileName.substring(fileName.lastIndexOf("/") + 1);
      }
      if (cleanName.includes("?")) {
        cleanName = cleanName.split("?")[0];
      }

      await Filesystem.deleteFile({
        path: cleanName,
        directory: Directory.Data,
      });
      return true;
    } catch (e) {
      console.info("Failed to delete image mobile (might not exist):", e);
      return false;
    }
  }

  async getAllImages(): Promise<string[]> {
    if (this.platform === "electron") {
      return await window.electronAPI.getAllImages();
    }

    // Mobile
    try {
      const result = await Filesystem.readdir({
        path: "",
        directory: Directory.Data,
      });

      // Filter and map to simple strings
      return result.files
        .map((f) => (typeof f === "string" ? f : f.name))
        .filter((name) => name.endsWith(".png"));
    } catch (e) {
      console.error("Failed to list images mobile:", e);
      return [];
    }
  }

  async getImageUrl(fileName: string): Promise<string> {
    if (this.platform === "electron") {
      return `media://${fileName}`;
    }

    // Mobile implementation
    try {
      // Read file directly as Base64 to bypass WebView URL/CSP issues
      const fileData = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Data,
      });

      // Assume PNG as per saveImage
      return `data:image/png;base64,${fileData.data}`;
    } catch (e: any) {
      console.error("Failed to load image data mobile:", e);
      try {
        const dir = await Filesystem.readdir({
          path: "",
          directory: Directory.Data,
        });
        const files = dir.files
          .map((f) => (typeof f === "string" ? f : f.name))
          .join(", ");
        window.alert(
          `READ ERROR: ${
            e.message
          }\nTarget: ${fileName}\n\nExisting Files: ${files.substring(
            0,
            200,
          )}...`,
        );
      } catch {
        window.alert(`READ ERROR: ${e.message}\n(And failed to list dir)`);
      }
      return "";
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const storageService = new StorageServiceImpl();
