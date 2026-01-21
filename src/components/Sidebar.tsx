import React from "react";
import { type Note } from "../types";
import { FileText, CheckSquare, Image as ImageIcon } from "lucide-react";

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onNoteSelect: (id: string) => void;
  onAddNote: (type: "text" | "checklist" | "image") => void;
  onDeleteNote: (id: string, e: React.MouseEvent) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  activeNoteId,
  onNoteSelect,
  onAddNote,
  onDeleteNote,
}) => {
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
    <div className="flex flex-col h-full bg-slate-950 text-slate-300">
      <div className="p-6 pt-12 border-b border-white/5 relative">
        <h1 className="text-3xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent text-center">
          NBF Notes
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {notes.map((note) => (
          <div
            key={note.id}
            onClick={() => onNoteSelect(note.id)}
            className={`
                        group relative p-3 rounded-lg cursor-pointer transition-all duration-200
                        ${
                          activeNoteId === note.id
                            ? "bg-white/10 text-white shadow-lg"
                            : "hover:bg-white/5 hover:text-white"
                        }
                    `}
          >
            <div className="font-medium truncate pr-10 flex items-center gap-2 text-lg">
              {getTypeIcon(note.type)}
              <span className="truncate">{note.title || "Untitled Note"}</span>
            </div>
            <div className="text-xs text-white/40 mt-1 truncate pl-6">
              {new Date(note.updatedAt).toLocaleDateString()}
            </div>

            <button
              onClick={(e) => onDeleteNote(note.id, e)}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-all p-2"
              title="Delete note"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>
        ))}

        {notes.length === 0 && (
          <div className="text-center text-white/20 mt-10 text-sm">
            No notes yet
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/5 grid grid-cols-3 gap-1">
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
    </div>
  );
};
