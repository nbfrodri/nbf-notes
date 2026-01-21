import React, { useEffect, useState } from "react";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Link } from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Link as LinkIcon,
  Hash,
  RemoveFormatting,
  Type,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { type Note } from "../types";

// Define FontSize extension locally
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return {
      types: ["textStyle"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.style?.fontSize?.replace(/['"]+/g, "") || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});

// Define LineHeight extension locally
const LineHeight = Extension.create({
  name: "lineHeight",
  addOptions() {
    return {
      types: ["paragraph", "heading"],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style?.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },
});

interface RichEditorProps {
  note: Note | undefined;
  onUpdate: (id: string, updates: Partial<Note>) => void;
}

const MenuButton = ({
  isActive,
  onClick,
  children,
  title,
  className,
}: {
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={twMerge(
      "p-2 rounded hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-100",
      isActive && "bg-slate-700 text-slate-100",
      className,
    )}
  >
    {children}
  </button>
);

export const RichEditor: React.FC<RichEditorProps> = ({ note, onUpdate }) => {
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [fontSize, setFontSize] = useState("16");
  const [lineHeight, setLineHeight] = useState("1.6");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
      TextStyle,
      Color,
      FontSize,
      LineHeight,
      // Configure Link correctly, ensuring no duplication if HMR triggers re-mount issues
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class:
            "text-blue-400 underline cursor-pointer hover:text-blue-300 transition-colors",
        },
      }),
    ],
    content: note?.content || "",
    editorProps: {
      attributes: {
        class: twMerge(
          "prose prose-invert prose-lg max-w-none focus:outline-none [&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:p-0 [&_li[data-type='taskItem']]:flex [&_li[data-type='taskItem']]:gap-2 [&_li[data-type='taskItem']]:items-start [&_input[type='checkbox']]:mt-1.5",
          showLineNumbers && "show-line-numbers",
        ),
      },
    },
    onUpdate: ({ editor }) => {
      if (note) {
        onUpdate(note.id, { content: editor.getHTML() });
      }
    },
  });

  useEffect(() => {
    if (editor && note && note.content !== editor.getHTML()) {
      editor.commands.setContent(note.content);
    }
  }, [note?.id, editor]);

  useEffect(() => {
    if (editor?.view?.dom) {
      if (showLineNumbers) {
        editor.view.dom.classList.add("show-line-numbers");
      } else {
        editor.view.dom.classList.remove("show-line-numbers");
      }
    }
  }, [showLineNumbers, editor]);

  // Update inputs when selection changes
  useEffect(() => {
    if (!editor) return;
    const updateAttributes = () => {
      const attrs = editor.getAttributes("textStyle");
      const paraAttrs = editor.getAttributes("paragraph");
      const headingAttrs = editor.getAttributes("heading");

      // Font Size
      if (attrs.fontSize) {
        setFontSize(attrs.fontSize.replace("px", ""));
      } else {
        setFontSize("16");
      }

      // Line Height (check paragraph or heading)
      const lh = paraAttrs.lineHeight || headingAttrs.lineHeight;
      if (lh) {
        setLineHeight(lh);
      } else {
        setLineHeight("1.6");
      }
    };
    editor.on("selectionUpdate", updateAttributes);
    editor.on("update", updateAttributes);
    return () => {
      editor.off("selectionUpdate", updateAttributes);
      editor.off("update", updateAttributes);
    };
  }, [editor]);

  if (!note) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p>Select a note or create a new one</p>
      </div>
    );
  }

  const setLink = () => {
    const previousUrl = editor?.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = e.target.value;
    setFontSize(size);
    if (size) {
      editor
        ?.chain()
        .focus()
        .setMark("textStyle", { fontSize: `${size}px` })
        .run();
    } else {
      editor?.chain().focus().unsetMark("textStyle").run();
    }
  };

  const handleLineHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lh = e.target.value;
    setLineHeight(lh);
    // Apply to both paragraph and headings to be safe
    if (lh) {
      editor
        ?.chain()
        .focus()
        .updateAttributes("paragraph", { lineHeight: lh })
        .run();
      editor
        ?.chain()
        .focus()
        .updateAttributes("heading", { lineHeight: lh })
        .run();
    } else {
      editor?.chain().focus().resetAttributes("paragraph", "lineHeight").run();
      editor?.chain().focus().resetAttributes("heading", "lineHeight").run();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-8 pt-12">
      <input
        type="text"
        value={note.title}
        onChange={(e) => onUpdate(note.id, { title: e.target.value })}
        placeholder="Note Title"
        className="bg-transparent text-4xl font-bold text-white placeholder-slate-600 focus:outline-none mb-6 w-full"
      />

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 mb-4 border-b border-slate-800 flex-wrap sticky top-0 bg-slate-900/95 backdrop-blur z-10">
        <MenuButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          isActive={editor?.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          isActive={editor?.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          isActive={editor?.isActive("strike")}
          title="Strike (Ctrl+Shift+X)"
        >
          <Strikethrough size={18} />
        </MenuButton>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {/* Color Picker Only */}
        <div className="flex items-center gap-1 mx-1" title="Text Color">
          <input
            type="color"
            onInput={(event) =>
              editor
                ?.chain()
                .focus()
                .setColor((event.target as HTMLInputElement).value)
                .run()
            }
            className="w-8 h-8 rounded bg-transparent cursor-pointer border-none p-0"
            value={editor?.getAttributes("textStyle").color || "#e2e8f0"}
          />
        </div>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {/* Font Size Input */}
        <div className="flex items-center gap-1 mx-1" title="Font Size (px)">
          <input
            type="number"
            min="8"
            max="128"
            value={fontSize}
            onChange={handleFontSizeChange}
            className="w-16 bg-slate-800 text-slate-100 border border-slate-700 rounded p-1 text-sm focus:outline-none focus:border-blue-500"
          />
          <span className="text-slate-500 text-xs">px</span>
        </div>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {/* Line Height Input */}
        <div
          className="flex items-center gap-1 mx-1"
          title="Line Height (Interlineado)"
        >
          <Type size={16} className="text-slate-400" />
          <input
            type="number"
            min="1.0"
            max="3.0"
            step="0.1"
            value={lineHeight}
            onChange={handleLineHeightChange}
            className="w-14 bg-slate-800 text-slate-100 border border-slate-700 rounded p-1 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <MenuButton
          onClick={() => editor?.chain().focus().unsetAllMarks().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting size={18} />
        </MenuButton>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <MenuButton
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor?.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={18} />
        </MenuButton>
        <MenuButton
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor?.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={18} />
        </MenuButton>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <MenuButton
          onClick={setLink}
          isActive={editor?.isActive("link")}
          title="Link"
        >
          <LinkIcon size={18} />
        </MenuButton>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <MenuButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          isActive={editor?.isActive("bulletList")}
          title="Bullet List"
        >
          <List size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor?.isActive("orderedList")}
          title="Ordered List"
        >
          <ListOrdered size={18} />
        </MenuButton>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <MenuButton
          onClick={() => setShowLineNumbers(!showLineNumbers)}
          isActive={showLineNumbers}
          title="Toggle Line Numbers"
        >
          <Hash size={18} />
        </MenuButton>

        <div className="w-px h-6 bg-slate-700 mx-1 ml-auto" />

        <MenuButton
          onClick={() => editor?.chain().focus().undo().run()}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={18} />
        </MenuButton>
        <MenuButton
          onClick={() => editor?.chain().focus().redo().run()}
          title="Redo (Ctrl+Y)"
        >
          <Redo size={18} />
        </MenuButton>
      </div>

      <div
        className="flex-1 overflow-y-auto px-1 pb-12 cursor-text"
        onClick={() => editor?.chain().focus().run()}
      >
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};
