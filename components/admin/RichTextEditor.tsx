"use client";

import { useEffect } from "react";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function RichTextEditor({
  value,
  onChange,
  disabled = false,
}: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "",
    editable: !disabled,

    immediatelyRender: false,

    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },

    editorProps: {
      attributes: {
        class:
          "min-h-[180px] px-4 py-3 text-sm text-zinc-800 outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();

    if (currentHtml !== value) {
      editor.commands.setContent(value || "", {
        emitUpdate: false,
      });
    }
  }, [editor, value]);

  if (!editor) {
    return (
      <div className="min-h-[220px] rounded-xl border border-zinc-200 bg-white" />
    );
  }

  const toolbarButton =
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950";

  const activeButton =
    "bg-emerald-50 !text-emerald-700";

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-zinc-200 bg-zinc-50 px-2 py-2">
        <button
          type="button"
          title="Negrito"
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().toggleBold().run()
          }
          className={`${toolbarButton} ${
            editor.isActive("bold") ? activeButton : ""
          }`}
        >
          <Bold size={16} />
        </button>

        <button
          type="button"
          title="Itálico"
          disabled={disabled}
          onClick={() =>
            editor.chain().focus().toggleItalic().run()
          }
          className={`${toolbarButton} ${
            editor.isActive("italic") ? activeButton : ""
          }`}
        >
          <Italic size={16} />
        </button>

        <div className="mx-1 h-5 w-px bg-zinc-200" />

        <button
          type="button"
          title="Título"
          disabled={disabled}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleHeading({ level: 2 })
              .run()
          }
          className={`${toolbarButton} ${
            editor.isActive("heading", {
              level: 2,
            })
              ? activeButton
              : ""
          }`}
        >
          <Heading2 size={16} />
        </button>

        <button
          type="button"
          title="Lista"
          disabled={disabled}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBulletList()
              .run()
          }
          className={`${toolbarButton} ${
            editor.isActive("bulletList")
              ? activeButton
              : ""
          }`}
        >
          <List size={17} />
        </button>

        <button
          type="button"
          title="Lista numerada"
          disabled={disabled}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleOrderedList()
              .run()
          }
          className={`${toolbarButton} ${
            editor.isActive("orderedList")
              ? activeButton
              : ""
          }`}
        >
          <ListOrdered size={17} />
        </button>

        <button
          type="button"
          title="Citação"
          disabled={disabled}
          onClick={() =>
            editor
              .chain()
              .focus()
              .toggleBlockquote()
              .run()
          }
          className={`${toolbarButton} ${
            editor.isActive("blockquote")
              ? activeButton
              : ""
          }`}
        >
          <Quote size={16} />
        </button>

        <div className="mx-1 h-5 w-px bg-zinc-200" />

        <button
          type="button"
          title="Desfazer"
          disabled={
            disabled ||
            !editor.can().chain().focus().undo().run()
          }
          onClick={() =>
            editor.chain().focus().undo().run()
          }
          className={toolbarButton}
        >
          <Undo2 size={16} />
        </button>

        <button
          type="button"
          title="Refazer"
          disabled={
            disabled ||
            !editor.can().chain().focus().redo().run()
          }
          onClick={() =>
            editor.chain().focus().redo().run()
          }
          className={toolbarButton}
        >
          <Redo2 size={16} />
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}