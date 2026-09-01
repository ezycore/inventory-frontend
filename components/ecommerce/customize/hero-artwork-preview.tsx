// coding-standard: maintained

import type { StoreFocalPoint } from "@/lib/storefront-focal";
import { focalPosition } from "@/lib/storefront-focal";
import { cropsPhoto } from "@/components/ecommerce/customize/photo-fit-field";

function Preview({
  label,
  url,
  focal,
  ratio,
  fallback,
  imageFit,
}: {
  label: string;
  url?: string;
  focal?: StoreFocalPoint;
  ratio: string;
  fallback?: boolean;
  imageFit?: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center justify-between gap-1 text-[10px] text-muted-foreground">
        <span className="font-medium text-foreground">{label}</span>
        {fallback ? <span>desktop fallback</span> : null}
      </div>
      <div
        className="overflow-hidden rounded-md border bg-muted/40"
        style={{ aspectRatio: ratio }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="h-full w-full"
            style={{
              objectFit: cropsPhoto(imageFit) ? "cover" : "contain",
              objectPosition: focalPosition(focal),
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

/** The two actual hero shapes, visible together before the merchant saves. */
export function HeroArtworkPreview({
  desktopUrl,
  mobileUrl,
  desktopRatio = "5 / 2",
  imageFit,
  focal,
  mobileFocal,
}: {
  desktopUrl?: string;
  mobileUrl?: string;
  desktopRatio?: "5 / 2" | "4 / 3";
  imageFit?: string;
  focal?: StoreFocalPoint;
  mobileFocal?: StoreFocalPoint;
}) {
  if (!desktopUrl && !mobileUrl) return null;
  const phoneUrl = mobileUrl || desktopUrl;
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg border bg-background p-2.5">
      <Preview
        label={`Desktop · ${desktopRatio === "4 / 3" ? "4:3" : "5:2"}`}
        url={desktopUrl}
        focal={focal}
        ratio={desktopRatio}
        imageFit={imageFit}
      />
      <Preview
        label="Mobile · 16:9"
        url={phoneUrl}
        focal={mobileFocal || focal}
        ratio="16 / 9"
        fallback={!mobileUrl && !!desktopUrl}
        imageFit={imageFit}
      />
    </div>
  );
}
