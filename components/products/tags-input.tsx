"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/ui/components/badge";
import { cn } from "@/ui/lib/utils";

interface TagsInputProps {
  value?: string[];
  onChange?: (val: string[]) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  /** Max number of tags allowed (default: unlimited). */
  maxTags?: number;
}

/**
 * Free-text tag entry: type and press Enter (or comma) to add a chip,
 * Backspace on an empty input removes the last chip. Stores a `string[]`.
 *
 * Used as a `customComponent` in DynamicForm (Controller-wrapped by the parent).
 */
export default function TagsInput({
  value = [],
  onChange,
  onBlur,
  disabled,
  placeholder = "Type a tag and press Enter",
  error,
  maxTags,
}: TagsInputProps) {
  const [draft, setDraft] = useState("");
  const tags = Array.isArray(value) ? value : [];

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag) return;
    if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    if (maxTags && tags.length >= maxTags) return;
    onChange?.([...tags, tag]);
    setDraft("");
  };

  const removeTag = (index: number) => {
    onChange?.(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && draft === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        disabled && "cursor-not-allowed opacity-60",
        error ? "border-red-500" : "border-input",
      )}
      onClick={(e) => {
        const input = e.currentTarget.querySelector("input");
        input?.focus();
      }}
    >
      {tags.map((tag, index) => (
        <Badge key={`${tag}-${index}`} variant="secondary" className="gap-1">
          {tag}
          {!disabled && (
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="rounded-sm hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      <input
        value={draft}
        disabled={disabled}
        placeholder={tags.length === 0 ? placeholder : ""}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          addTag(draft);
          onBlur?.();
        }}
        className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-[8rem]"
      />
    </div>
  );
}
