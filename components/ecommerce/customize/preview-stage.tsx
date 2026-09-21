"use client";
// coding-standard: maintained

import type { CSSProperties, ReactNode, Ref } from "react";
import { Monitor, Moon, Smartphone, Sun } from "lucide-react";
import { cn } from "@/ui/lib/utils";
import { DESKTOP_PREVIEW_WIDTH } from "@/components/ecommerce/customize/use-preview-scale";
import type { PreviewTheme } from "@/components/ecommerce/customize/use-preview-theme";

/**
 * The pieces every storefront preview in the admin shares — Customize's
 * `BrowserPreview` and the page editor's `PagePreviewFrame`: the device switch,
 * the theme switch, the stage the iframe sits on, and the iframe's size for each
 * device.
 */

export type PreviewDevice = "desktop" | "mobile";

/** The icon buttons beside a preview: reload, open-in-a-tab, theme. */
export const previewToolbarButton =
  "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

const deviceButton = (active: boolean) =>
  cn(
    "rounded p-1.5 transition-colors",
    active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
  );

/** The Desktop / Mobile switch above a storefront preview. */
export function PreviewDeviceToggle({
  device,
  onChange,
}: {
  device: PreviewDevice;
  onChange: (device: PreviewDevice) => void;
}) {
  return (
    <div className="flex rounded-md border p-0.5">
      <button
        type="button"
        onClick={() => onChange("desktop")}
        aria-label="Desktop view"
        aria-pressed={device === "desktop"}
        className={deviceButton(device === "desktop")}
      >
        <Monitor className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("mobile")}
        aria-label="Mobile view"
        aria-pressed={device === "mobile"}
        className={deviceButton(device === "mobile")}
      >
        <Smartphone className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * The Light / Dark switch above a storefront preview.
 *
 * One button showing the theme it switches TO, rather than a second segmented
 * control: the shop's own header toggle is the same gesture, and two segmented
 * controls side by side read as one four-way switch.
 *
 * It previews the SHOPPER's toggle (`.sf-root[data-theme]`), which is not a
 * merchant setting — there is nothing to save here, and a section whose
 * background the merchant set to a fixed colour stays that colour in both, which
 * is exactly what a shopper sees.
 */
export function PreviewThemeToggle({
  theme,
  onChange,
}: {
  theme: PreviewTheme;
  onChange: (theme: PreviewTheme) => void;
}) {
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => onChange(dark ? "light" : "dark")}
      aria-label={dark ? "Preview in light mode" : "Preview in dark mode"}
      aria-pressed={dark}
      title={dark ? "Preview in light mode" : "Preview in dark mode"}
      className={cn(previewToolbarButton, dark && "bg-muted text-foreground")}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

/**
 * Where a preview iframe sits: a real desktop width scaled to fit (`hostRef` is
 * what `usePreviewScale` measures), or a phone frame. Switching device only
 * resizes the same iframe, so the frame never reloads.
 */
export function PreviewStage({
  device,
  hostRef,
  height,
  overlay,
  children,
}: {
  device: PreviewDevice;
  hostRef: Ref<HTMLDivElement>;
  height: string;
  /** Drawn over the stage — e.g. a "Loading preview…" cover. */
  overlay?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="relative flex justify-center overflow-auto bg-muted/20"
      style={{ height, minHeight: 560 }}
    >
      <div
        ref={device === "desktop" ? hostRef : undefined}
        className={cn(
          "flex-none overflow-hidden bg-white",
          device === "mobile"
            ? // `max-w-`, not a hard `w-`: 390px plus the 10px bezels is wider
              // than the phone a merchant may be standing on.
              "my-5 h-[calc(100%-2.5rem)] w-full max-w-[390px] rounded-[2.2rem] border-[10px] border-neutral-800 shadow-2xl"
            : "h-full w-full",
        )}
      >
        {children}
      </div>
      {overlay}
    </div>
  );
}

/**
 * The iframe's size for a device.
 *
 * On desktop the frame is laid out at a real desktop width and scaled down to fit
 * — see `usePreviewScale` for why a rail theme was previewing with no rail — using
 * `zoom`, **not** `transform: scale()`. The storefront is on its own subdomain, so
 * the frame is an OOPIF, and a transformed OOPIF does not repaint: Chrome keeps
 * showing a stale blank layer while the DOM inside is fully built. `zoom` scales
 * through layout, so the frame is laid out at its final size and paints like any
 * other. The height is in the frame's own unzoomed coordinates — height × zoom
 * lands on the host exactly, where a percentage would resolve in the zoomed space
 * and come up short.
 */
export function previewFrameSize(device: PreviewDevice, scale: number, frameHeight: number): CSSProperties {
  return device === "desktop"
    ? { zoom: scale, width: DESKTOP_PREVIEW_WIDTH, height: frameHeight || "100%" }
    : { width: "100%", height: "100%" };
}
