import { useState, useEffect } from "react";
import { type Note, type Folder } from "../types";
import { storageService } from "../services/storage";

const FOLDERS_STORAGE_KEY = "proton-notes-folders";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);

  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem(FOLDERS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Load notes on mount
  useEffect(() => {
    const load = async () => {
      const loadedNotes = await storageService.loadNotes();
      // Sort by updatedAt desc
      loadedNotes.sort((a, b) => b.updatedAt - a.updatedAt);
      setNotes(loadedNotes);
    };
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(folders));
  }, [folders]);

  const addNote = async (
    type: "text" | "checklist" | "image" = "text",
    folderId?: string,
  ) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "New Note",
      content: type === "image" ? "[]" : "", // Initialize image note with empty array string
      type,
      folderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Optimistic update
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);

    // Save to file
    await storageService.saveNote(newNote);
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    // Image Cleanup Logic for Image Collection Notes
    if (note.type === "image" && updates.content) {
      try {
        const oldImages = JSON.parse(note.content || "[]");
        const newImages = JSON.parse(updates.content || "[]");

        if (Array.isArray(oldImages) && Array.isArray(newImages)) {
          const newImageIds = new Set(newImages.map((img: any) => img.id));
          // Find images present in old but missing in new
          for (const img of oldImages) {
            if (!newImageIds.has(img.id)) {
              // Determine filename to delete.
              const pathToDelete = img.storagePath || img.url;
              if (pathToDelete) {
                console.log("Cleaning up image:", pathToDelete);
                storageService.deleteImage(pathToDelete);
              }
            }
          }
        }
      } catch (e) {
        console.error("Error identifying images to delete:", e);
      }
    }

    const updatedNote = { ...note, ...updates, updatedAt: Date.now() };

    setNotes((prev) => prev.map((n) => (n.id === id ? updatedNote : n)));

    // Persist
    await storageService.saveNote(updatedNote);
  };

  const deleteNote = async (id: string) => {
    const note = notes.find((n) => n.id === id);

    // Image Cleanup for deleted note
    if (note && note.type === "image" && note.content) {
      try {
        const images = JSON.parse(note.content);
        if (Array.isArray(images)) {
          for (const img of images) {
            // Check for storagePath (New) or url (Legacy/Electron)
            const pathToDelete = img.storagePath || img.url;
            if (pathToDelete) {
              console.log("Deleting associated image:", pathToDelete);
              storageService.deleteImage(pathToDelete);
            }
          }
        }
      } catch (e) {
        console.error("Error cleaning up images for deleted note:", e);
      }
    }

    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }

    await storageService.deleteNote(id);
  };

  // Folder actions
  const addFolder = (name: string) => {
    const newFolder: Folder = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
    };
    setFolders([...folders, newFolder]);
  };

  const updateFolder = (id: string, updates: Partial<Folder>) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  const deleteFolder = (id: string) => {
    // Move notes to root
    const notesToUpdate = notes.filter((n) => n.folderId === id);

    setNotes((prev) =>
      prev.map((n) => (n.folderId === id ? { ...n, folderId: undefined } : n)),
    );

    // Determine if we need to save these updates to disk?
    // Yes, because folder separation is persisted in the note object.
    notesToUpdate.forEach((n) => {
      storageService.saveNote({ ...n, folderId: undefined });
    });

    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  const reorderNotes = (newNotes: Note[]) => setNotes(newNotes);
  const reorderFolders = (newFolders: Folder[]) => setFolders(newFolders);

  return {
    notes,
    folders,
    activeNoteId,
    setActiveNoteId,
    addNote,
    updateNote,
    deleteNote,
    addFolder,
    updateFolder,
    deleteFolder,
    reorderNotes,
    reorderFolders,
  };
}
