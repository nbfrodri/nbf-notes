import React, { useState } from "react";
import { type Note, type Folder } from "../types";
import {
  FileText,
  CheckSquare,
  Image as ImageIcon,
  Folder as FolderIcon,
  FolderOpen,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Edit2,
} from "lucide-react";
import {
  DndContext,
  useDroppable,
  type DragEndEvent,
  DragOverlay,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  type DragStartEvent,
  closestCenter,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SidebarProps {
  notes: Note[];
  folders: Folder[];
  activeNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onAddNote: (type: "text" | "checklist" | "image", folderId?: string) => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  onAddFolder: (name: string) => void;
  onUpdateFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onReorderNotes: (notes: Note[]) => void;
  onReorderFolders: (folders: Folder[]) => void;
}

// Draggable Note Item Component
const NoteItem = ({
  note,
  activeNoteId,
  onNoteSelect,
  onDeleteNote,
}: {
  note: Note;
  activeNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transform,
    transition,
  } = useSortable({
    id: note.id,
    data: { type: "note", note },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getTypeIcon = (type: Note["type"]) => {
    switch (type) {
      case "checklist":
        return <CheckSquare size={14} className="text-emerald-400" />;
      case "image":
        return <ImageIcon size={14} className="text-blue-400" />;
      default:
        return <FileText size={14} className="text-indigo-400" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => {
        // Prevent click if dragging (handled by dnd-kit usually, but explicit check good)
        if (!isDragging) onNoteSelect(note.id);
      }}
      className={`
                group relative p-2 md:p-2 py-3 rounded-lg cursor-pointer transition-all duration-200
                flex items-center gap-2 select-none touch-manipulation
                ${
                  activeNoteId === note.id
                    ? "bg-white/10 text-white shadow-lg"
                    : "hover:bg-white/5 hover:text-white active:bg-white/5 text-slate-400"
                }
                ${isDragging ? "opacity-30 z-50 bg-slate-800" : ""}
            `}
    >
      <div className="shrink-0">{getTypeIcon(note.type)}</div>
      <span className="truncate flex-1 text-sm font-medium">
        {note.title || "Untitled Note"}
      </span>
      <button
        onClick={(e) => onDeleteNote(note.id, e)}
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all md:block"
        title="Delete note"
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on delete button
      >
        <span className="text-lg leading-none">×</span>
      </button>
    </div>
  );
};

// Sortable Folder Component
const FolderItem = ({
  folder,
  notes,
  activeNoteId,
  expanded,
  onToggle,
  onNoteSelect,
  onAddNote,
  onDeleteNote,
  onUpdateFolder,
  onDeleteFolder,
}: {
  folder: Folder;
  notes: Note[];
  activeNoteId: string | null;
  expanded: boolean;
  onToggle: () => void;
  onNoteSelect: (id: string) => void;
  onAddNote: (type: "text" | "checklist" | "image", folderId: string) => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
  onUpdateFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
}) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: folder.id,
    data: { type: "folder", folder },
  });

  const { setNodeRef: setDroppableNodeRef, isOver: isDroppableOver } =
    useDroppable({
      id: `droppable-${folder.id}`, // Distinct ID for dropping *into* folder vs sorting folder
      data: { type: "folder-drop-zone", folderId: folder.id },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameName, setRenameName] = useState(folder.name);

  const handleRename = () => {
    if (renameName.trim()) {
      onUpdateFolder(folder.id, renameName.trim());
      setIsRenaming(false);
    } else {
      setRenameName(folder.name); // Revert if empty
      setIsRenaming(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-2 ${isDragging ? "opacity-50" : ""}`}
    >
      <div
        className={`
            flex items-center justify-between p-2 rounded-lg cursor-pointer text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors group select-none touch-manipulation
            ${
              isDroppableOver || isOver // Highlight if dragging over folder itself or its drop zone
                ? "bg-blue-500/20 border border-blue-500/30"
                : ""
            }
        `}
        onClick={onToggle}
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {/* Use Grip for Folder Dragging specifically? Or whole row? Using whole row but might conflict with toggle. Let's make toggle separate button or ensure propagation works. Dnd-kit usually handles it. */}
          <div
            onClick={(e) => {
              e.stopPropagation(); // Separate toggle click
              onToggle();
            }}
            className="hover:text-white p-0.5 rounded"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>

          {expanded ? (
            <FolderOpen size={16} className="text-yellow-500/80" />
          ) : (
            <FolderIcon size={16} className="text-yellow-500/80" />
          )}
          {isRenaming ? (
            <input
              autoFocus
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setIsRenaming(false);
                  setRenameName(folder.name);
                }
              }}
              onBlur={handleRename}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent text-sm text-white focus:outline-hidden border-b border-indigo-500 min-w-[100px]"
            />
          ) : (
            <>
              <span className="font-medium truncate text-sm">
                {folder.name}
              </span>
              <span className="text-xs text-slate-600 ml-1">
                ({notes.length})
              </span>
            </>
          )}
        </div>
        <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddNote("text", folder.id);
            }}
            className="p-1 hover:text-indigo-400"
            title="Create note in folder"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Plus size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsRenaming(true);
            }}
            className="p-1 hover:text-indigo-400 ml-1"
            title="Rename folder"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(folder.id);
            }}
            className="p-1 hover:text-red-400 ml-1"
            title="Delete folder"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div
        ref={setDroppableNodeRef} // Make the area *under* the folder droppable too? Or just the list?
        className={expanded ? "" : "hidden"}
      >
        <div className="pl-4 border-l border-white/5 ml-3 mt-1 space-y-0.5">
          <SortableContext
            items={notes.map((n) => n.id)}
            strategy={verticalListSortingStrategy}
          >
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                activeNoteId={activeNoteId}
                onNoteSelect={onNoteSelect}
                onDeleteNote={onDeleteNote}
              />
            ))}
          </SortableContext>
          {notes.length === 0 && (
            <div className="text-xs text-slate-600 py-2 pl-2 italic">
              Empty folder
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  folders,
  activeNoteId,
  onNoteSelect,
  onAddNote,
  onDeleteNote,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  onUpdateNote,
  onReorderNotes,
  onReorderFolders,
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [activeDragItem, setActiveDragItem] = useState<{
    type: "note" | "folder";
    data: Note | Folder;
  } | null>(null);

  const { setNodeRef: setRootNodeRef } = useDroppable({
    id: "root-droppable",
    data: { type: "root-drop-zone" },
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(folderId)) {
        newExpanded.delete(folderId);
      } else {
        newExpanded.add(folderId);
      }
      return newExpanded;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === "note") {
      setActiveDragItem({ type: "note", data: active.data.current?.note });
    } else if (type === "folder") {
      setActiveDragItem({ type: "folder", data: active.data.current?.folder });
    }
  };

  const handleDragOver = () => {
    // Optional: Add logic to expand folders on hover?
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragItem(null);
    const { active, over } = event;

    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    // Handle Folder Sorting
    if (
      activeType === "folder" &&
      (overType === "folder" || overType === "folder-drop-zone")
    ) {
      // Reordering folders
      if (active.id !== over.id) {
        const oldIndex = folders.findIndex((f) => f.id === active.id);
        const newIndex = folders.findIndex((f) => f.id === over.id); // Or derive from over folder if it's a zone
        // If sorting folders, standard arrayMove
        // Note: SortableContext needs items prop to match
        if (oldIndex !== -1 && newIndex !== -1) {
          onReorderFolders(arrayMove(folders, oldIndex, newIndex));
        }
      }
      return;
    }

    // Handle Note Logic
    if (activeType === "note") {
      const noteId = active.id as string;
      const note = active.data.current?.note as Note;

      // 1. Move to Folder (Dropping onto a folder or its drop zone)
      if (overType === "folder" || overType === "folder-drop-zone") {
        const targetFolderId =
          overType === "folder"
            ? (over.id as string)
            : (over.data.current?.folderId as string);

        // If dragging onto same folder, do nothing unless it's for sorting (handled below)
        // But if dropping ON container, usually means "move into"
        // If dropping ON item in container, means "sort near"
        // Let's distinguish:
        // Use separate ID for folder droppable vs folder sortable item?
        // In FolderItem component:
        // Sortable ID: folder.id
        // Droppable ID: droppable-{folder.id}

        if (String(over.id).startsWith("droppable-") || overType === "folder") {
          // Move to folder
          if (note.folderId !== targetFolderId) {
            onUpdateNote(noteId, { folderId: targetFolderId });
            // Auto expand
            setExpandedFolders((prev) => new Set(prev).add(targetFolderId));
          }
          // If same folder, let sort logic handle it?
          // But dropping on "Folder Header" (which is the over here) should probably just move it to end?
          // SortableContext handles reorder if over is another Note.
          return;
        }
      }

      // 2. Move to Root (Dropping onto Unfiled Area)
      if (over.id === "root-droppable") {
        if (note.folderId) {
          onUpdateNote(noteId, { folderId: undefined });
        }
        return;
      }

      // 3. Reordering Notes
      if (overType === "note") {
        const overNote = over.data.current?.note as Note;

        // If different containers (folders), move note to new container at specific index?
        // Integrating move + sort is tricky.
        // Simplest: If folders match, reorder. If not, also move.

        const activeFolderId = note.folderId;
        const overFolderId = overNote.folderId;

        if (activeFolderId !== overFolderId) {
          // Changed folder (and order)
          // 1. Update folderId
          onUpdateNote(noteId, { folderId: overFolderId });
          // 2. We can try to reorder too, but might need to wait for state update.
          // For now just move.
          return;
        }

        // Same folder reordering
        if (active.id !== over.id) {
          // Get all notes (global list)
          // Reorder the global list?
          // Yes, notes state is a flat array.
          const oldIndex = notes.findIndex((n) => n.id === active.id);
          const newIndex = notes.findIndex((n) => n.id === over.id);
          onReorderNotes(arrayMove(notes, oldIndex, newIndex));
        }
      }
    }
  };

  const unfiledNotes = notes.filter((n) => !n.folderId);
  // Do NOT sort folders alphabetically. Use natural order.
  // Do NOT sort notes? They come from store in order.

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreatingFolder(false);
    } else {
      setIsCreatingFolder(false); // Cancel if empty
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-300">
        {/* Drag Region for Sidebar */}
        <div
          className="p-6 border-b border-white/5 relative shrink-0 pt-[calc(1.5rem+env(safe-area-inset-top))]"
          style={{ WebkitAppRegion: "drag" } as unknown as React.CSSProperties}
        >
          <h1 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
            NBF Notes
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {/* Folders */}
          {isCreatingFolder && (
            <div className="mb-2 p-2 rounded-lg bg-white/5 border border-indigo-500/50">
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") {
                    setIsCreatingFolder(false);
                    setNewFolderName("");
                  }
                }}
                onBlur={handleCreateFolder}
                placeholder="Folder Name"
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-hidden"
              />
            </div>
          )}

          <SortableContext
            items={folders.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                notes={notes.filter((n) => n.folderId === folder.id)}
                activeNoteId={activeNoteId}
                expanded={expandedFolders.has(folder.id)}
                onToggle={() => toggleFolder(folder.id)}
                onNoteSelect={onNoteSelect}
                onAddNote={onAddNote}
                onDeleteNote={onDeleteNote}
                onUpdateFolder={onUpdateFolder}
                onDeleteFolder={onDeleteFolder}
                onUpdateNote={onUpdateNote}
              />
            ))}
          </SortableContext>

          {/* Separator / Root Drop Zone */}
          <div className="mt-4 mb-2 px-2 text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Unfiled Notes</span>
          </div>

          <div ref={setRootNodeRef} className="space-y-0.5 min-h-[50px] pb-20">
            <SortableContext
              items={unfiledNotes.map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              {unfiledNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  activeNoteId={activeNoteId}
                  onNoteSelect={onNoteSelect}
                  onDeleteNote={onDeleteNote}
                />
              ))}
            </SortableContext>
            {unfiledNotes.length === 0 && notes.length > 0 && (
              <div className="text-center text-slate-700 text-xs py-4 border border-dashed border-slate-800 rounded-lg">
                Drag notes here to unfile
              </div>
            )}
          </div>

          {notes.length === 0 && (
            <div className="text-center text-white/20 mt-10 text-sm">
              No notes yet
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-white/5 space-y-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-slate-950">
          {/* Add Note Buttons */}
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => onAddNote("text")}
              className="py-2 px-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 hover:text-white font-medium transition-colors text-xs flex flex-col items-center justify-center gap-1 border border-indigo-500/20"
              title="New Text Note"
            >
              <FileText size={16} />
              <span>Text</span>
            </button>
            <button
              onClick={() => onAddNote("checklist")}
              className="py-2 px-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-200 hover:text-white font-medium transition-colors text-xs flex flex-col items-center justify-center gap-1 border border-emerald-500/20"
              title="New Checklist"
            >
              <CheckSquare size={16} />
              <span>Task</span>
            </button>
            <button
              onClick={() => onAddNote("image")}
              className="py-2 px-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 hover:text-white font-medium transition-colors text-xs flex flex-col items-center justify-center gap-1 border border-blue-500/20"
              title="New Image Collection"
            >
              <ImageIcon size={16} />
              <span>Image</span>
            </button>
          </div>

          {/* Add Folder Button */}
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-medium transition-colors text-xs flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600"
          >
            <FolderIcon size={14} />
            <span>New Folder</span>
          </button>
        </div>
      </div>
      <DragOverlay>
        {activeDragItem ? (
          <div className="bg-slate-800 p-3 rounded-lg shadow-2xl text-white flex items-center gap-2 border border-slate-600 opacity-90 w-48 z-50">
            {activeDragItem.type === "folder" ? (
              <FolderIcon size={16} className="text-yellow-500" />
            ) : (
              <FileText size={16} />
            )}
            <span className="truncate">
              {activeDragItem.type === "folder"
                ? (activeDragItem.data as Folder).name
                : (activeDragItem.data as Note).title}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
