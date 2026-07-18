"use client";
// coding-standard: maintained
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  MessageCircleQuestion,
  Minus,
  Quote,
} from "lucide-react";
import { cn } from "@ui/lib/utils";
import { Button } from "@/ui/components/button";
import { LinkPopover } from "./link-popover";

/**
 * Formatting toolbar for RichTextEditor. All buttons are type="button" — the
 * editor mounts inside DynamicForm's <form>, where a bare <button> submits.
 */

type Level = 1 | 2 | 3;

function ToolButton({
  onClick,
  active,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn("size-8", active && "bg-accent text-accent-foreground")}
    >
      {children}
    </Button>
  );
}

const Divider = () => <div aria-hidden className="mx-1 h-5 w-px bg-border" />;

export function RichTextToolbar({ editor }: { editor: Editor | null }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            h1: e.isActive("heading", { level: 1 }),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bulletList: e.isActive("bulletList"),
            orderedList: e.isActive("orderedList"),
            blockquote: e.isActive("blockquote"),
            link: e.isActive("link"),
            editable: e.isEditable,
          }
        : null,
  });

  const off = !editor || !state || !state.editable;
  const chain = () => editor!.chain().focus();
  const heading = (level: Level) => chain().toggleHeading({ level }).run();
  const headingIcons: Record<Level, React.ReactNode> = { 1: <Heading1 />, 2: <Heading2 />, 3: <Heading3 /> };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1.5 py-1">
      {([1, 2, 3] as Level[]).map((level) => (
        <ToolButton
          key={level}
          label={`Heading ${level}`}
          active={state?.[`h${level}`]}
          disabled={off}
          onClick={() => heading(level)}
        >
          {headingIcons[level]}
        </ToolButton>
      ))}
      <Divider />
      <ToolButton label="Bold" active={state?.bold} disabled={off} onClick={() => chain().toggleBold().run()}>
        <Bold />
      </ToolButton>
      <ToolButton label="Italic" active={state?.italic} disabled={off} onClick={() => chain().toggleItalic().run()}>
        <Italic />
      </ToolButton>
      <LinkPopover editor={editor} active={state?.link} disabled={off} />
      <Divider />
      <ToolButton
        label="Bullet list"
        active={state?.bulletList}
        disabled={off}
        onClick={() => chain().toggleBulletList().run()}
      >
        <List />
      </ToolButton>
      <ToolButton
        label="Numbered list"
        active={state?.orderedList}
        disabled={off}
        onClick={() => chain().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolButton>
      <ToolButton
        label="Quote"
        active={state?.blockquote}
        disabled={off}
        onClick={() => chain().toggleBlockquote().run()}
      >
        <Quote />
      </ToolButton>
      <ToolButton label="Divider line" disabled={off} onClick={() => chain().setHorizontalRule().run()}>
        <Minus />
      </ToolButton>
      <Divider />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={off}
        onClick={() => chain().insertFaqBlock().run()}
        title="Insert a styled Q&A card"
        className="h-8 gap-1.5 px-2 text-xs"
      >
        <MessageCircleQuestion /> Add Q&A
      </Button>
    </div>
  );
}
