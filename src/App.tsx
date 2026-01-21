import { useState } from "react";
import { Layout } from "./components/Layout";
import { Sidebar } from "./components/Sidebar";
import { RichEditor } from "./components/RichEditor";
import { ChecklistEditor } from "./components/ChecklistEditor";
import { ImageCollection } from "./components/ImageCollection";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { useNotes } from "./store/useNotes";

function App() {
  const {
    notes,
    activeNoteId,
    setActiveNoteId,
    addNote,
    updateNote,
    deleteNote,
  } = useNotes();

  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteToDelete(id);
  };

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete);
      setNoteToDelete(null);
    }
  };

  return (
    <>
      <Layout
        sidebar={
          <Sidebar
            notes={notes}
            activeNoteId={activeNoteId}
            onNoteSelect={setActiveNoteId}
            onAddNote={addNote}
            onDeleteNote={handleDeleteClick}
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
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </>
  );
}

export default App;
