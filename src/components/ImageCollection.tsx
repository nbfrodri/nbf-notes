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

const SortableImage = ({
  img,
  removeImage,
  handleRename,
  onClick,
}: {
  img: { id: string; url: string; name: string };
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
        <img
          src={img.url}
          alt={img.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          draggable={false}
          onError={(e) => {
            console.error("Image load error:", img.url, e);
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
  const [images, setImages] = useState<
    { id: string; url: string; name: string }[]
  >([]);
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

  // Parse images from content on load
  useEffect(() => {
    if (note?.content) {
      try {
        const parsed = JSON.parse(note.content);
        if (Array.isArray(parsed)) {
          // Migration: Convert string[] to object[] if needed
          const normalized = parsed.map((item) => {
            if (typeof item === "string") {
              return { id: item, url: item, name: "Untitled Image" }; // Backward compatibility
            }
            return item;
          });
          setImages(normalized);
        } else {
          setImages([]);
        }
      } catch (e) {
        console.error("ImageCollection: Failed to parse content", e);
        setImages([]);
      }
    } else {
      // Only set empty if note is defined, but content is empty
      if (note) setImages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id]);

  const saveImages = (
    newImages: { id: string; url: string; name: string }[],
  ) => {
    console.log("ImageCollection: Saving images", newImages);
    setImages(newImages);
    if (note) {
      onUpdate(note.id, { content: JSON.stringify(newImages) });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        if (note) {
          // Defer update to avoid state mismatch during drag?
          // Actually usually fine. But better to update store after state.
          // Using callback form setImages is good, but we need to update note.
          // We can do it in useEffect or here. Here is fine.
          setTimeout(
            () => onUpdate(note.id, { content: JSON.stringify(newItems) }),
            0,
          );
          return newItems;
        }
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
      const newImages: { id: string; url: string; name: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`ImageCollection: Processing file ${file.name}`);
        try {
          const buffer = await file.arrayBuffer();
          const imagePath = await storageService.saveImage(buffer);

          // Use filename as default name (remove extension)
          const name = file.name.replace(/\.[^/.]+$/, "");

          newImages.push({
            id: crypto.randomUUID(),
            url: imagePath,
            name: name,
          });
        } catch (error) {
          console.error("ImageCollection: Failed to save image", error);
        }
      }
      if (newImages.length > 0) {
        saveImages([...images, ...newImages]);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (idToRemove: string) => {
    const newImages = images.filter((img) => img.id !== idToRemove);
    saveImages(newImages);
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
    saveImages(updated);
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
          {/* Close Button Removed as requested */}

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
          <img
            src={images[selectedImageIndex].url}
            alt={images[selectedImageIndex].name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />

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
