// components/TextEditor/TipTap.tsx
import "./styles.scss";
import { Color } from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import { EditorProvider, useCurrentEditor, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, { useEffect } from "react";
import Underline from "@tiptap/extension-underline";

// This component will now be rendered inside the BubbleMenu
const EditorBubbleMenu = () => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  const setLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    // cancelled
    if (url === null) {
      return;
    }
    // empty
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    // update link
    editor.chain().focus().setLink({ href: url }).run();
  };

  // Helper function to prevent form submission
  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <BubbleMenu
      className="bubble-menu"
      tippyOptions={{ duration: 150 }}
      editor={editor}
      shouldShow={({ from, to }) => {
        return from !== to;
      }}>
      <div>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBold().run())}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "is-active" : ""}>
          Bold
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleItalic().run())}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "is-active" : ""}>
          Italic
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleUnderline().run())}
          disabled={!editor.can().chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "is-active" : ""}>
          Underline
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleStrike().run())}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={editor.isActive("strike") ? "is-active" : ""}>
          Strike
        </button>

        <button
          type="button"
          onClick={setLink}
          className={editor.isActive("link") ? "is-active" : ""}>
          Add Link
        </button>

        {editor.isActive("link") && (
          <button 
            type="button" 
            onClick={(e) => handleButtonClick(e, () => editor.chain().focus().unsetLink().run())}>
            Remove Link
          </button>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().setParagraph().run())}
          className={editor.isActive("paragraph") ? "is-active" : ""}>
          Paragraph
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleHeading({ level: 1 }).run())}
          className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}>
          H1
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
          className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}>
          H2
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleHeading({ level: 3 }).run())}
          className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}>
          H3
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBulletList().run())}
          className={editor.isActive("bulletList") ? "is-active" : ""}>
          Bullet list
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBlockquote().run())}
          className={editor.isActive("blockquote") ? "is-active" : ""}>
          Blockquote
        </button>
      </div>
      <div>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().setColor("#FF4C4C").run())}
          className={editor.isActive("textStyle", { color: "#FF4C4C" }) ? "is-active" : ""}
          style={{ color: "#FF4C4C" }}>
          Red
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().setColor("#FFA500").run())}
          className={editor.isActive("textStyle", { color: "#FFA500" }) ? "is-active" : ""}
          style={{ color: "#FFA500" }}>
          Orange
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().setColor("#4CAF50").run())}
          className={editor.isActive("textStyle", { color: "#4CAF50" }) ? "is-active" : ""}
          style={{ color: "#4CAF50" }}>
          Green
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().setColor("#2196F3").run())}
          className={editor.isActive("textStyle", { color: "#2196F3" }) ? "is-active" : ""}
          style={{ color: "#2196F3" }}>
          Blue
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().setColor("#958DF1").run())}
          className={editor.isActive("textStyle", { color: "#958DF1" }) ? "is-active" : ""}
          style={{ color: "#958DF1" }}>
          Purple
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().unsetColor().run())}
          className={!editor.isActive("textStyle", { color: null }) ? "" : "is-active"}>
          No Color
        </button>
      </div>
      <div>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().undo().run())}
          disabled={!editor.can().chain().focus().undo().run()}>
          Undo (Ctrl Z)
        </button>
        <button
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().redo().run())}
          disabled={!editor.can().chain().focus().redo().run()}>
          Redo (Ctrl Y)
        </button>
        <button 
          type="button"
          onClick={(e) => handleButtonClick(e, () => editor.chain().focus().clearNodes().run())}>
          Clear Styling
        </button>
      </div>
    </BubbleMenu>
  );
};

const extensions = [
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
  }),
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.extend({
    addOptions() {
      return {
        ...this.parent?.(),
        types: [ListItem.name],
      };
    },
  }),
  Underline.extend({
    addKeyboardShortcuts() {
      return {
        "Mod-u": () => this.editor.commands.toggleUnderline(),
      };
    },
  }),
  Link.configure({
    openOnClick: true,
    HTMLAttributes: {
      target: "_blank",
      rel: "noopener noreferrer",
    },
  }),
];

type TiptapProps = {
  initialText: string;
  setText: (value: string) => void;
};

// Create a small wrapper component to handle the editor updates
const EditorContentUpdater: React.FC<{ initialText: string }> = ({ initialText }) => {
  const { editor } = useCurrentEditor();
  
  useEffect(() => {
    // Only update content if the editor exists and the content has actually changed
    if (editor && editor.getHTML() !== initialText) {
      editor.commands.setContent(initialText);
    }
  }, [initialText, editor]);
  
  return null;
};

const Tiptap: React.FC<TiptapProps> = ({ initialText, setText }) => {
  return (
    <EditorProvider
      slotBefore={<EditorBubbleMenu />}
      extensions={extensions}
      content={initialText}
      onUpdate={({ editor }) => {
        const html = editor.getHTML();
        setText(html);
      }}>
      {/* This component will handle content updates */}
      <EditorContentUpdater initialText={initialText} />
    </EditorProvider>
  );
};

export default Tiptap;