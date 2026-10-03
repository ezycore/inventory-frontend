"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@ui/lib/utils";

/**
 * Camera-based barcode scanner using `@zxing/browser`.
 * Lazy-loads zxing so it doesn't bloat the initial bundle.
 *
 * Calls `onDetect(code)` once per code put in front of the camera. A code held
 * in view keeps being decoded every frame; it fires again only after it has
 * been out of view for `duplicateDebounceMs`. (A fixed window from the last
 * accepted read re-fired a held code every second — a POS adding +1 per tick.)
 *
 * `onDetect` / `onError` are read through refs, so a caller passing a fresh
 * callback each render doesn't stop and restart the camera.
 */
export interface BarcodeScannerProps {
  onDetect: (code: string) => void;
  onError?: (err: Error) => void;
  className?: string;
  /** Show a stop button (caller-controlled via `active` is preferred). */
  active?: boolean;
  /** How long a code must be out of view before it can fire again. Default 1000ms. */
  duplicateDebounceMs?: number;
}

export function BarcodeScanner({
  onDetect,
  onError,
  className,
  active = true,
  duplicateDebounceMs = 1000,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const lastCode = useRef<{ code: string; at: number } | null>(null);
  const onDetectRef = useRef(onDetect);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onDetectRef.current = onDetect;
    onErrorRef.current = onError;
  });
  const [status, setStatus] = useState<"idle" | "starting" | "running" | "error">(
    "idle",
  );

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setStatus("starting");

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (cancelled) return;
        const reader = new BrowserMultiFormatReader();
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        // Prefer rear-facing on mobile
        const deviceId =
          devices.find((d) => /back|rear|environment/i.test(d.label))?.deviceId ||
          devices[0]?.deviceId;

        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, err) => {
            if (result) {
              const code = result.getText();
              const now = performance.now();
              if (
                lastCode.current &&
                lastCode.current.code === code &&
                now - lastCode.current.at < duplicateDebounceMs
              ) {
                // Still in view: push the window forward, don't fire.
                lastCode.current.at = now;
                return;
              }
              lastCode.current = { code, at: now };
              onDetectRef.current(code);
            }
            // ignore per-frame "NotFound" errors silently
            if (err && err.name !== "NotFoundException") {
              onErrorRef.current?.(err);
            }
          },
        );
        controlsRef.current = controls;
        setStatus("running");
      } catch (e) {
        setStatus("error");
        onErrorRef.current?.(e as Error);
      }
    })();

    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {
        // noop
      }
      controlsRef.current = null;
    };
  }, [active, duplicateDebounceMs]);

  return (
    <div className={cn("relative w-full overflow-hidden rounded-md bg-black", className)}>
      <video
        ref={videoRef}
        className="w-full h-auto"
        muted
        playsInline
        autoPlay
      />
      {status === "starting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm">
          Starting camera…
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm p-4 text-center">
          Camera unavailable. Check browser permissions.
        </div>
      )}
    </div>
  );
}
