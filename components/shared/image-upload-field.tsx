"use client";
// coding-standard: maintained

import { Camera, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useRef } from "react";
import {
  IMAGE_UPLOAD_ACCEPT,
  type PendingImage,
} from "@/hooks/use-image-upload-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Button } from "@/ui/components/button";

/**
 * One labelled image field — preview tile plus upload / change / remove /
 * cancel controls, backed by a hidden file input.
 *
 * Pairs with `useImageUploadField`, which owns the staged-file state; this
 * component is presentational and holds only the input ref. Split that way
 * because the organization settings tab renders two of these (logo, favicon)
 * and was already past the component size threshold with one of them inline.
 *
 * The upload does not happen here: both fields ride along on the settings
 * form's own Save, so `onPick` stages a file rather than sending it.
 */
export function ImageUploadField({
  sectionIcon,
  sectionLabel,
  hint,
  currentUrl,
  fallback,
  fallbackClassName,
  alt,
  pending,
  labels,
  onPick,
  onRemove,
  onCancel,
}: {
  sectionIcon: ReactNode;
  sectionLabel: string;
  /** Node, not string — callers append an empty-state note below the hint. */
  hint: ReactNode;
  currentUrl: string | null;
  /** Shown when there is no image: initials, or the icon the product falls back to. */
  fallback: ReactNode;
  fallbackClassName?: string;
  alt: string;
  pending: PendingImage;
  labels: {
    upload: string;
    change: string;
    remove: string;
    cancel: string;
  };
  onPick: (file: File | undefined) => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {sectionIcon}
        <span>{sectionLabel}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group shrink-0">
          <Avatar className="h-20 w-20 rounded-lg border-2 border-background shadow ring-1 ring-border">
            {currentUrl ? (
              <AvatarImage
                key={currentUrl}
                src={currentUrl}
                alt={alt}
                className="object-contain bg-muted"
              />
            ) : null}
            <AvatarFallback className={fallbackClassName}>
              {fallback}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 space-y-2">
          <div className="text-sm text-muted-foreground">{hint}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              {currentUrl ? labels.change : labels.upload}
            </Button>
            {currentUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={onRemove}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {labels.remove}
              </Button>
            )}
            {pending && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                {labels.cancel}
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_UPLOAD_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ""; // allow re-selecting the same file
              onPick(file);
            }}
          />
        </div>
      </div>
    </div>
  );
}
