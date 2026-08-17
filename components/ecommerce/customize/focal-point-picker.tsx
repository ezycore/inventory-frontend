"use client";
// coding-standard: maintained

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import {
  CENTRE_FOCAL,
  clampPercent,
  focalPosition,
  type StoreFocalPoint,
} from "@/lib/storefront-focal";
import { Button } from "@/ui/components/button";

/** Arrow-key step, in percent. Coarse on purpose — this is a crop, not a caret. */
const NUDGE = 5;

/**
 * Pick the part of a hero photo that must survive a crop.
 *
 * The hero is a fixed height rather than a fixed ratio, so the same upload is a
 * wide strip on a desktop and nearly square on a phone. Without this the crop is
 * always centred, which is why the panel used to ask owners to compose around
 * it — advice that could not work, since it asked them to put the subject
 * exactly where the phone throws away.
 *
 * **The click target is the `<img>`, not its padded box**, so a photo of any
 * ratio maps its own edges to 0% and 100%. Sizing the picker box instead and
 * letting the image letterbox inside it would put the corners of a tall photo
 * somewhere in the grey. The preview beside it is the real phone crop, using the
 * same `focalPosition` the storefront paints with.
 */
export function FocalPointPicker({
  url,
  value,
  onChange,
}: {
  url: string;
  value?: StoreFocalPoint;
  /** `undefined` clears the point back to centre. */
  onChange: (focal: StoreFocalPoint | undefined) => void;
}) {
  const focal = value ?? CENTRE_FOCAL;
  const dragging = useRef(false);

  const setFromPointer = (e: PointerEvent<HTMLButtonElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (!box.width || !box.height) return;
    onChange({
      x: clampPercent(((e.clientX - box.left) / box.width) * 100),
      y: clampPercent(((e.clientY - box.top) / box.height) * 100),
    });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step: Record<string, [number, number]> = {
      ArrowLeft: [-NUDGE, 0],
      ArrowRight: [NUDGE, 0],
      ArrowUp: [0, -NUDGE],
      ArrowDown: [0, NUDGE],
    };
    const move = step[e.key];
    if (!move) return;
    e.preventDefault();
    onChange({
      x: clampPercent(focal.x + move[0]),
      y: clampPercent(focal.y + move[1]),
    });
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-stretch gap-2.5">
        <div className="flex flex-1 items-center justify-center rounded-lg border bg-muted/40 p-2">
          <button
            type="button"
            aria-label={`Focus point: ${focal.x}% from the left, ${focal.y}% from the top. Click the photo or use the arrow keys.`}
            className="relative block cursor-crosshair rounded-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              setFromPointer(e);
            }}
            onPointerMove={(e) => {
              if (dragging.current) setFromPointer(e);
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
            onKeyDown={onKeyDown}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt=""
              draggable={false}
              className="block max-h-[132px] w-auto max-w-full rounded-sm"
            />
            {/* Thirds, so "off-centre" is something the owner can see and aim at. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3"
            >
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} className="border border-white/25" />
              ))}
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.5)]"
              style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
            />
          </button>
        </div>
        <div className="flex w-[74px] flex-none flex-col gap-1">
          <div
            className="w-full overflow-hidden rounded-md border"
            style={{
              aspectRatio: "4 / 3",
              backgroundImage: `url("${url}")`,
              backgroundSize: "cover",
              backgroundPosition: focalPosition(focal),
            }}
          />
          <p className="text-center text-[10px] leading-tight text-muted-foreground">
            Phone crop
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs leading-snug text-muted-foreground">
          Tap the part that must stay visible.
        </p>
        {value ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto h-6 px-2 text-xs"
            onClick={() => onChange(undefined)}
          >
            Centre
          </Button>
        ) : null}
      </div>
    </div>
  );
}
