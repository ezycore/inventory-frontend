"use client";
// coding-standard: maintained
import { useEditorState, type Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { ImageButton } from "./image-button";
import { ImageControls } from "./toolbar-image-controls";
import { LinkPopover } from "./link-popover";
import { ColorPopover } from "./color-popover";
import { InsertMenu } from "./toolbar-insert-menu";
import { TableControls } from "./toolbar-table-controls";
import { ToolButton, ToolbarDivider } from "./toolbar-button";
import type { RichImageScope } from "./image-upload";

/**
 * Formatting toolbar for RichTextEditor. Grouped (marks · colour · headings ·
 * lists · alignment · insert) so the growing control set stays scannable; table
 * controls appear only inside a table. All buttons are type="button" — the
 * editor mounts inside DynamicForm's <form>, where a bare <button> submits.
 */
type Level = 1 | 2 | 3;
type Align = "left" | "center" | "right";

export function RichTextToolbar({
  editor,
  imageUpload,
}: {
  editor: Editor | null;
  /** Show the insert-image button. Opt-in — see `ImageButton`. */
  imageUpload?: RichImageScope;
}) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            strike: e.isActive("strike"),
            textColor: e.isActive("textStyle"),
            highlight: e.isActive("highlight"),
            h1: e.isActive("heading", { level: 1 }),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bulletList: e.isActive("bulletList"),
            orderedList: e.isActive("orderedList"),
            blockquote: e.isActive("blockquote"),
            link: e.isActive("link"),
            alignLeft: e.isActive({ textAlign: "left" }),
            alignCenter: e.isActive({ textAlign: "center" }),
            alignRight: e.isActive({ textAlign: "right" }),
            inTable: e.isActive("table"),
            inImage: e.isActive("image"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
            editable: e.isEditable,
          }
        : null,
  });

  const off = !editor || !state || !state.editable;
  const chain = () => editor!.chain().focus();
  const headingIcons: Record<Level, React.ReactNode> = { 1: <Heading1 />, 2: <Heading2 />, 3: <Heading3 /> };
  const alignIcons: Record<Align, React.ReactNode> = { left: <AlignLeft />, center: <AlignCenter />, right: <AlignRight /> };

  return (
    // Sticky, because the scroll container is the DRAWER body, not this box.
    // On a Return Policy the toolbar used to scroll away entirely and take every
    // formatting control with it — the merchant had to scroll back up to bold a
    // word. `bg-background` is required, not decorative: the editor container is
    // `bg-transparent`, so without it the text scrolls visibly under the buttons.
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-md border-b border-border bg-background px-1.5 py-1">
      {/* First in the row, and the only buttons disabled by their OWN state
          rather than by `off`: with nothing to undo the control has to look
          spent, or it reads as broken. Cmd+Z/Cmd+Shift+Z work regardless — the
          keybindings come from the UndoRedo extension, not from these. */}
      <ToolButton
        label="Undo"
        disabled={off || !state?.canUndo}
        onClick={() => chain().undo().run()}
      >
        <Undo2 />
      </ToolButton>
      <ToolButton
        label="Redo"
        disabled={off || !state?.canRedo}
        onClick={() => chain().redo().run()}
      >
        <Redo2 />
      </ToolButton>
      <ToolbarDivider />
      {([1, 2, 3] as Level[]).map((level) => (
        <ToolButton
          key={level}
          label={`Heading ${level}`}
          active={state?.[`h${level}`]}
          disabled={off}
          onClick={() => chain().toggleHeading({ level }).run()}
        >
          {headingIcons[level]}
        </ToolButton>
      ))}
      <ToolbarDivider />
      <ToolButton label="Bold" active={state?.bold} disabled={off} onClick={() => chain().toggleBold().run()}>
        <Bold />
      </ToolButton>
      <ToolButton label="Italic" active={state?.italic} disabled={off} onClick={() => chain().toggleItalic().run()}>
        <Italic />
      </ToolButton>
      <ToolButton label="Underline" active={state?.underline} disabled={off} onClick={() => chain().toggleUnderline().run()}>
        <Underline />
      </ToolButton>
      <ToolButton label="Strikethrough" active={state?.strike} disabled={off} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough />
      </ToolButton>
      <ColorPopover editor={editor} mode="text" active={state?.textColor} disabled={off} />
      <ColorPopover editor={editor} mode="highlight" active={state?.highlight} disabled={off} />
      <ToolbarDivider />
      <ToolButton label="Bullet list" active={state?.bulletList} disabled={off} onClick={() => chain().toggleBulletList().run()}>
        <List />
      </ToolButton>
      <ToolButton label="Numbered list" active={state?.orderedList} disabled={off} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered />
      </ToolButton>
      <ToolButton label="Quote" active={state?.blockquote} disabled={off} onClick={() => chain().toggleBlockquote().run()}>
        <Quote />
      </ToolButton>
      <ToolbarDivider />
      {(["left", "center", "right"] as Align[]).map((a) => (
        <ToolButton
          key={a}
          label={`Align ${a}`}
          active={state?.[`align${a[0].toUpperCase()}${a.slice(1)}` as "alignLeft" | "alignCenter" | "alignRight"]}
          disabled={off}
          onClick={() => chain().setTextAlign(a).run()}
        >
          {alignIcons[a]}
        </ToolButton>
      ))}
      <ToolbarDivider />
      <LinkPopover editor={editor} active={state?.link} disabled={off} />
      {imageUpload ? (
        <ImageButton editor={editor} scope={imageUpload} disabled={off} />
      ) : null}
      <InsertMenu editor={editor} disabled={off} />
      {/* Contextual, like the table controls below: an image's size/position
          only mean anything while one is selected. */}
      {state?.inImage ? (
        <>
          <ToolbarDivider />
          <ImageControls editor={editor} />
        </>
      ) : null}
      {state?.inTable ? (
        <>
          <ToolbarDivider />
          <TableControls editor={editor} />
        </>
      ) : null}
    </div>
  );
}
