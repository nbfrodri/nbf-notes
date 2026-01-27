import React, { useState, useEffect } from "react";
import { type Note } from "../types";
import {
  Plus,
  X,
  GripVertical,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SubTask {
  id: string;
  text: string;
  checked: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  description?: string;
  subtasks?: SubTask[];
  isExpanded?: boolean;
}

interface ChecklistEditorProps {
  note: Note | undefined;
  onUpdate: (id: string, updates: Partial<Note>) => void;
}

interface SortableItemProps {
  item: ChecklistItem;
  updateItem: (id: string, updates: Partial<ChecklistItem>) => void;
  deleteItem: (id: string) => void;
  addItem: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  item,
  updateItem,
  deleteItem,
  addItem,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const toggleExpand = () => {
    updateItem(item.id, { isExpanded: !item.isExpanded });
  };

  const handleSubtaskAdd = () => {
    const newSubtask: SubTask = {
      id: crypto.randomUUID(),
      text: "",
      checked: false,
    };
    const currentSubtasks = item.subtasks || [];
    updateItem(item.id, { subtasks: [...currentSubtasks, newSubtask] });
  };

  const handleSubtaskUpdate = (
    subtaskId: string,
    updates: Partial<SubTask>,
  ) => {
    if (!item.subtasks) return;
    const newSubtasks = item.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, ...updates } : st,
    );
    updateItem(item.id, { subtasks: newSubtasks });
  };

  const handleSubtaskDelete = (subtaskId: string) => {
    if (!item.subtasks) return;
    const newSubtasks = item.subtasks.filter((st) => st.id !== subtaskId);
    updateItem(item.id, { subtasks: newSubtasks });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/5 group transition-colors duration-200 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.1)] hover:bg-slate-900/60 ${
        isDragging
          ? "shadow-[0_0_30px_rgba(0,255,255,0.2)] border-cyan-500 z-50 bg-slate-900/90 scale-[1.02]"
          : "hover:translate-y-[-2px]"
      }`}
    >
      {/* Main Item Row */}
      <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 p-1 shrink-0 touch-none"
        >
          <GripVertical size={20} />
        </div>

        {/* Expand Toggle */}
        <button
          onClick={toggleExpand}
          className="text-slate-500 hover:text-slate-300 transition-colors p-1 shrink-0"
        >
          {item.isExpanded ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </button>

        <input
          type="checkbox"
          checked={item.checked}
          onChange={(e) => updateItem(item.id, { checked: e.target.checked })}
          className="w-5 h-5 md:w-6 md:h-6 rounded border-slate-600 bg-slate-700/50 text-cyan-400 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer shrink-0 shadow-[0_0_5px_rgba(0,255,255,0.2)]"
        />

        <input
          type="text"
          value={item.text}
          onChange={(e) => updateItem(item.id, { text: e.target.value })}
          placeholder="Task title..."
          className={`flex-1 bg-transparent border-none focus:ring-0 text-base md:text-lg font-medium min-w-0 ${
            item.checked
              ? "text-slate-500 line-through decoration-2 decoration-slate-600"
              : "text-slate-100"
          }`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addItem();
            }
          }}
        />

        <button
          onClick={() => deleteItem(item.id)}
          className="p-2 md:p-3 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all shrink-0"
        >
          <X size={20} />
        </button>
      </div>

      {/* Expanded Content */}
      {item.isExpanded && !isDragging && (
        <div className="px-12 pb-6 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Description */}
          <div className="relative">
            <textarea
              value={item.description || ""}
              onChange={(e) =>
                updateItem(item.id, { description: e.target.value })
              }
              placeholder="Add detailed description..."
              className="w-full bg-slate-900/50 text-slate-300 text-sm rounded-lg border border-white/5 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 p-3 min-h-[80px] resize-y placeholder-slate-600"
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Subtasks
            </h4>

            {(item.subtasks || []).map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-3 group/sub"
              >
                <CornerDownRight
                  size={14}
                  className="text-slate-600 shrink-0"
                />
                <input
                  type="checkbox"
                  checked={subtask.checked}
                  onChange={(e) =>
                    handleSubtaskUpdate(subtask.id, {
                      checked: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={subtask.text}
                  onChange={(e) =>
                    handleSubtaskUpdate(subtask.id, { text: e.target.value })
                  }
                  placeholder="Subtask..."
                  className={`flex-1 bg-transparent border-none focus:ring-0 text-sm ${
                    subtask.checked
                      ? "text-slate-600 line-through"
                      : "text-slate-300"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubtaskAdd();
                    }
                  }}
                />
                <button
                  onClick={() => handleSubtaskDelete(subtask.id)}
                  className="opacity-100 md:opacity-0 md:group-hover/sub:opacity-100 p-1 text-slate-600 hover:text-red-400 transition-all shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              onClick={handleSubtaskAdd}
              className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors mt-2 ml-7"
            >
              <Plus size={14} />
              Add Subtask
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ChecklistEditor: React.FC<ChecklistEditorProps> = ({
  note,
  onUpdate,
}) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag (allows scrolling)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (note?.content) {
      try {
        const parsed = JSON.parse(note.content);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }, [note?.id, note?.content]);

  const saveItems = (newItems: ChecklistItem[]) => {
    setItems(newItems);
    if (note) {
      onUpdate(note.id, { content: JSON.stringify(newItems) });
    }
  };

  const addItem = () => {
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: "",
      checked: false,
    };
    saveItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<ChecklistItem>) => {
    const newItems = items.map((item) =>
      item.id === id ? { ...item, ...updates } : item,
    );
    saveItems(newItems);
  };

  const deleteItem = (id: string) => {
    saveItems(items.filter((item) => item.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      saveItems(newItems);
    }
  };

  if (!note) return null;

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 md:p-8 md:pt-12 pb-20 md:pb-8">
      <input
        type="text"
        value={note.title}
        onChange={(e) => onUpdate(note.id, { title: e.target.value })}
        placeholder="Checklist Title"
        className="bg-transparent text-4xl font-bold text-white placeholder-slate-600 focus:outline-none mb-8 w-full drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
      />

      <button
        onClick={addItem}
        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-cyan-300 transition-all py-2 px-4 rounded-lg border border-dashed border-slate-700 hover:border-cyan-500/50 w-full justify-center hover:bg-cyan-500/5 hover:shadow-[0_0_10px_rgba(0,255,255,0.1)]"
      >
        <Plus size={20} />
        <span>Add Task</span>
      </button>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                updateItem={updateItem}
                deleteItem={deleteItem}
                addItem={addItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
