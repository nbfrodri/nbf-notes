import React, { useState, useEffect, useRef, useCallback } from "react";
import { type Note } from "../types";
import { Plus, X, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { storageService } from "../services/storage";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  TouchSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ImageCollectionProps {
  note: Note | undefined;
  onUpdate: (id: string, updates: Partial<Note>) => void;
}

interface ImageItem {
  id: string;
  storagePath: string; // The filename/path stored in FS
  name: string;
  displayUrl?: string; // Resolved runtime URL for display
}

const SortableImage = ({
  img,
  removeImage,
  handleRename,
  onClick,
}: {
  img: ImageItem;
  removeImage: (id: string) => void;
  handleRename: (id: string, name: string) => void;
  onClick: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative flex flex-col bg-slate-900/40 backdrop-blur-md rounded-xl overflow-hidden border border-white/5 shadow-glass transition-colors duration-200 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(0,255,255,0.15)] touch-manipulation select-none ${
        isDragging
          ? "z-50 opacity-90 border-cyan-500 shadow-[0_0_25px_rgba(0,255,255,0.25)] scale-105"
          : "hover:-translate-y-1"
      }`}
    >
      <div
        className="aspect-square w-full overflow-hidden bg-slate-900 relative cursor-pointer"
        onClick={onClick}
        title="View full size"
      >
        {img.displayUrl ? (
          <img
            src={img.displayUrl}
            alt={img.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            draggable={false}
            onError={(e) => {
              console.error("Image load error:", img.displayUrl, e);
              e.currentTarget.style.display = "none";
              e.currentTarget.parentElement?.classList.add(
                "flex",
                "items-center",
                "justify-center",
                "text-red-500",
              );
              e.currentTarget.parentElement!.innerHTML =
                "<span>Failed to load</span>";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <div className="animate-pulse bg-slate-800 w-full h-full" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto] divide-x divide-white/10 bg-white/5 border-t border-white/10">
        <div className="p-2 md:p-3 min-w-0 flex items-center">
          <input
            className="w-full text-[10px] md:text-xs text-slate-300 bg-transparent border border-transparent hover:border-slate-600 focus:border-blue-500 focus:bg-slate-900 focus:outline-none rounded px-1 py-0.5 truncate transition-all"
            value={img.name}
            onChange={(e) => handleRename(img.id, e.target.value)}
            placeholder="Image Name"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()} // Allow input focus
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeImage(img.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex items-center justify-center px-4 md:px-3 text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          title="Remove image"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const ImageCollection: React.FC<ImageCollectionProps> = ({
  note,
  onUpdate,
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  // Use index for navigation
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Parse images from content on load and resolving URLs
  useEffect(() => {
    if (note?.content) {
      try {
        const parsed = JSON.parse(note.content);
        if (Array.isArray(parsed)) {
          console.log("ImageCollection: Parsed content", parsed);
          // Normalize and Migrate
          const normalized = parsed.map((item: any) => {
            // Backward compatibility: Array of strings
            if (typeof item === "string") {
              const filename = extractFilename(item);
              return {
                id: crypto.randomUUID(),
                storagePath: filename,
                name: "Untitled Image",
              };
            }
            // Backward compatibility: Old object structure { id, url, name }
            // If it has 'url' but not 'storagePath', treat 'url' as potentially broken full path
            // and extract filename.
            if (item.url && !item.storagePath) {
              const filename = extractFilename(item.url);
              return {
                ...item,
                storagePath: filename,
                displayUrl: undefined, // Force resolution
              };
            }
            return item;
          });

          // Set initial state (displayUrl might be missing)
          setImages(normalized);

          // Resolve URLs asynchronously
          resolveImageUrls(normalized);
        } else {
          setImages([]);
        }
      } catch (e) {
        console.error("ImageCollection: Failed to parse content", e);
        setImages([]);
      }
    } else {
      if (note) setImages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]); // Only re-run if note ID changes (load new note)

  const extractFilename = (pathOrUrl: string): string => {
    // Basic extraction logic
    let clean = pathOrUrl;
    if (clean.startsWith("media://")) {
      return clean.replace("media://", "");
    }
    if (clean.includes("/")) {
      clean = clean.substring(clean.lastIndexOf("/") + 1);
    }
    if (clean.includes("?")) {
      clean = clean.split("?")[0];
    }
    return clean;
  };

  const resolveImageUrls = async (items: ImageItem[]) => {
    console.log("ImageCollection: Resolving URLs for", items.length, "items");
    const updatedItems = await Promise.all(
      items.map(async (item) => {
        if (item.displayUrl) return item; // Already resolved
        const url = await storageService.getImageUrl(item.storagePath);
        return { ...item, displayUrl: url };
      }),
    );
    // Only update if something changed to avoid loops if this was triggered nicely
    // Use functional update to ensure we don't overwrite user edits if any occurred during load?
    // Actually safe to just set here for now as this runs on load.
    setImages(updatedItems);
  };

  // Helper to save state to note content (persisting ONLY storage data)
  const saveToNote = (currentImages: ImageItem[]) => {
    // Strip displayUrl before saving
    const toSave = currentImages.map(({ id, storagePath, name }) => ({
      id,
      storagePath,
      name,
    }));
    if (note) {
      onUpdate(note.id, { content: JSON.stringify(toSave) });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Defer save to update note
        setTimeout(() => saveToNote(newItems), 0);
        return newItems;
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    console.log("ImageCollection: File input change", files);
    if (files && files.length > 0) {
      const newItems: ImageItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`ImageCollection: Processing file ${file.name}`);
        try {
          const buffer = await file.arrayBuffer();
          // saveImage now returns the filename/storagePath
          const storagePath = await storageService.saveImage(buffer);

          // Resolve URL immediately for display
          const displayUrl = await storageService.getImageUrl(storagePath);

          // Use filename as default name (remove extension)
          const name = file.name.replace(/\.[^/.]+$/, "");

          newItems.push({
            id: crypto.randomUUID(),
            storagePath: storagePath,
            name: name,
            displayUrl: displayUrl,
          });
        } catch (error) {
          console.error("ImageCollection: Failed to save image", error);
        }
      }

      if (newItems.length > 0) {
        const updatedImages = [...images, ...newItems];
        setImages(updatedImages);
        saveToNote(updatedImages);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (idToRemove: string) => {
    const newImages = images.filter((img) => img.id !== idToRemove);
    setImages(newImages); // Update UI
    saveToNote(newImages); // Update Persistence

    // Determine what to do with selection if current image is removed
    if (selectedImageIndex !== null) {
      const currentId = images[selectedImageIndex]?.id;
      if (currentId === idToRemove) {
        setSelectedImageIndex(null);
      } else {
        // Re-calculate index because it shifted
        const newIndex = newImages.findIndex((img) => img.id === currentId);
        setSelectedImageIndex(newIndex === -1 ? null : newIndex);
      }
    }
  };

  const handleRename = (id: string, newName: string) => {
    const updated = images.map((img) =>
      img.id === id ? { ...img, name: newName } : img,
    );
    setImages(updated);
    saveToNote(updated);
  };

  const goToNext = useCallback(() => {
    setSelectedImageIndex((prev) => {
      if (prev === null) return null;
      return (prev + 1) % images.length;
    });
  }, [images.length]);

  const goToPrev = useCallback(() => {
    setSelectedImageIndex((prev) => {
      if (prev === null) return null;
      return (prev - 1 + images.length) % images.length;
    });
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (selectedImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "Escape") {
        setSelectedImageIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, goToNext, goToPrev]);

  // Touch/Swipe Logic
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null; // Reset
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext(); // Swipe Left -> Next Image
    }
    if (isRightSwipe) {
      goToPrev(); // Swipe Right -> Prev Image
    }
  };

  if (!note) return null;

  return (
    <>
      <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-8 md:pt-12 pb-20 md:pb-8">
        <input
          type="text"
          value={note.title}
          onChange={(e) => onUpdate(note.id, { title: e.target.value })}
          placeholder="Collection Title"
          className="bg-transparent text-4xl font-bold text-white placeholder-slate-600 focus:outline-none mb-8 w-full drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
        />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {images.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl p-12 text-slate-500">
              <Upload size={48} className="mb-4 opacity-50" />
              <p className="text-xl font-medium mb-2">No images yet</p>
              <p className="mb-6">Upload images to start your collection</p>
              <button
                onClick={handleUploadClick}
                className="flex items-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/20 hover:border-cyan-500/50 px-6 py-3 rounded-lg font-medium transition-all shadow-[0_0_10px_rgba(0,255,255,0.1)]"
              >
                <Plus size={20} />
                <span>Add Images</span>
              </button>
            </div>
          ) : (
            <SortableContext items={images} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-max pb-20">
                {images.map((img, index) => (
                  <SortableImage
                    key={img.id}
                    img={img}
                    removeImage={removeImage}
                    handleRename={handleRename}
                    onClick={() => setSelectedImageIndex(index)}
                  />
                ))}
                <button
                  onClick={handleUploadClick}
                  className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl text-slate-500 hover:text-blue-400 hover:border-blue-400/50 hover:bg-blue-400/5 transition-all group"
                >
                  <div className="p-4 rounded-full bg-slate-800 group-hover:bg-blue-500/10 mb-3 transition-colors">
                    <Plus size={32} />
                  </div>
                  <span className="font-medium">Add More</span>
                </button>
              </div>
            </SortableContext>
          )}
        </DndContext>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
      </div>

      {/* Image Modal */}
      {selectedImageIndex !== null && images[selectedImageIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedImageIndex(null)}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Previous Button - Hidden on mobile */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 hidden md:block"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            title="Previous Image (Left Arrow)"
          >
            <ChevronLeft size={48} />
          </button>

          {/* Next Button - Hidden on mobile */}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50 hidden md:block"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            title="Next Image (Right Arrow)"
          >
            <ChevronRight size={48} />
          </button>

          {/* Image */}
          {images[selectedImageIndex].displayUrl ? (
            <img
              src={images[selectedImageIndex].displayUrl}
              alt={images[selectedImageIndex].name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()}
              draggable={false}
            />
          ) : (
            <div className="text-white">Loading...</div>
          )}

          <div className="absolute bottom-16 md:bottom-8 left-0 right-0 text-center pointer-events-none">
            <span className="text-white/80 bg-black/50 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
              {images[selectedImageIndex].name} ({selectedImageIndex + 1} /{" "}
              {images.length})
            </span>
          </div>
        </div>
      )}
    </>
  );
};
