"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@ui/components/input";
import { cn } from "@ui/lib/utils";

/**
 * USB / Bluetooth keyboard-wedge scanner input.
 *
 * Detects rapid keystrokes (chars typed < 30 ms apart) ending with `Enter` as
 * a scan, and calls `onScan(code)`. Typing manually + pressing Enter also works.
 * Auto-clears the input after scan.
 */
export interface BarcodeInputProps {
  onScan: (code: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  disabled?: boolean;
  /** Max gap (ms) between scanned chars for it to count as a scan. Default 30. */
  scanGapMs?: number;
}

export function BarcodeInput({
  onScan,
  placeholder = "Scan or type barcode…",
  autoFocus = false,
  className,
  disabled,
  scanGapMs = 30,
}: BarcodeInputProps) {
  const [value, setValue] = useState("");
  const lastKeyTime = useRef<number>(0);
  const isScanning = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const submit = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    onScan(trimmed);
    setValue("");
    isScanning.current = false;
    lastKeyTime.current = 0;
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        const now = performance.now();
        const delta = now - lastKeyTime.current;
        if (e.key === "Enter") {
          e.preventDefault();
          submit(value);
          return;
        }
        // single char keys arriving fast → likely scanner
        if (e.key.length === 1) {
          if (lastKeyTime.current && delta < scanGapMs) {
            isScanning.current = true;
          }
          lastKeyTime.current = now;
        }
      }}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
      spellCheck={false}
      className={cn("font-mono", className)}
    />
  );
}
