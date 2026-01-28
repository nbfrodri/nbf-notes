import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Sidebar } from "./components/Sidebar";
import { RichEditor } from "./components/RichEditor";
import { ChecklistEditor } from "./components/ChecklistEditor";
import { ImageCollection } from "./components/ImageCollection";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { useNotes } from "./store/useNotes";
// import { storageService } from "./services/storage";

function App() {
  const {
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
  } = useNotes();

  // Startup Garbage Collection
  // Startup Garbage Collection (DISABLED TEMPORARILY due to persistent image deletion issues)
  useEffect(() => {
    /* 
    const runCleanup = async () => {
      try {
        console.log("Starting garbage collection...");
        const allNotes = await storageService.loadNotes();
        const usedImages = new Set<string>();

        // ... (Cleanup logic preserved in comments)
        
         // 2. Get all files and delete unused
        const allFiles = await storageService.getAllImages();
        console.log(
          `GC: Found ${allFiles.length} files, ${usedImages.size} used.`,
        );

        for (const file of allFiles) {
          if (!usedImages.has(file)) {
            console.log("GC: Deleting orphaned file", file);
            await storageService.deleteImage(file);
          }
        }
        console.log("Garbage collection complete.");
      } catch (error) {
        console.error("Garbage collection failed:", error);
      }
    };

    // Run after a short delay to ensure initial load doesn't conflict (though FS IO is fine)
    const timeout = setTimeout(runCleanup, 1000);
    return () => clearTimeout(timeout);
    */
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: "note" | "folder";
    id: string;
  } | null>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const requestDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmation({ type: "note", id });
  };

  const requestDeleteFolder = (id: string) => {
    setDeleteConfirmation({ type: "folder", id });
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      if (deleteConfirmation.type === "note") {
        deleteNote(deleteConfirmation.id);
      } else {
        deleteFolder(deleteConfirmation.id);
      }
      setDeleteConfirmation(null);
    }
  };

  return (
    <>
      <Layout
        isSidebarOpen={isSidebarOpen}
        onSidebarChange={setIsSidebarOpen}
        sidebar={
          <Sidebar
            notes={notes}
            folders={folders}
            activeNoteId={activeNoteId}
            onNoteSelect={(id) => {
              setActiveNoteId(id);
              setIsSidebarOpen(false); // Close sidebar on selection
            }}
            onAddNote={(type, folderId) => {
              addNote(type, folderId);
              setIsSidebarOpen(false);
            }}
            onDeleteNote={requestDeleteNote}
            onAddFolder={addFolder}
            onUpdateFolder={updateFolder}
            onDeleteFolder={requestDeleteFolder}
            onUpdateNote={updateNote}
            onReorderNotes={reorderNotes}
            onReorderFolders={reorderFolders}
          />
        }
        content={
          activeNote?.type === "checklist" ? (
            <ChecklistEditor note={activeNote} onUpdate={updateNote} />
          ) : activeNote?.type === "image" ? (
            <ImageCollection note={activeNote} onUpdate={updateNote} />
          ) : (
            <RichEditor note={activeNote} onUpdate={updateNote} />
          )
        }
      />

      <ConfirmationModal
        isOpen={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
        title={
          deleteConfirmation?.type === "folder"
            ? "Delete Folder"
            : "Delete Note"
        }
        message={
          deleteConfirmation?.type === "folder"
            ? "Are you sure you want to delete this folder? Notes inside will become unfiled."
            : "Are you sure you want to delete this note? This action cannot be undone."
        }
        confirmLabel="Delete"
        isDestructive={true}
      />
    </>
  );
}

export default App;
