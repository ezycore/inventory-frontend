"use client";
// coding-standard: maintained

import { useState, type CSSProperties } from "react";
import { videoPlayerUrl, type VideoEmbed } from "@/lib/storefront-builder/video-embed";

/**
 * The video section's cover and player. Until pressed it is a button over a
 * cover picture — no provider request of any kind; pressed, the provider's
 * player replaces it and starts. The merchant's video name is the button's and
 * the player's accessible name, since the storefront has no wording of its own
 * for "play". Loaded only through the island map.
 */
export function VideoIsland({
  embed,
  label,
  poster,
  ratio,
}: {
  embed: VideoEmbed;
  label: string;
  poster?: string;
  ratio: string;
}) {
  const [playing, setPlaying] = useState(false);
  const box: CSSProperties = { ...frame, aspectRatio: ratio };

  if (playing) {
    return (
      <div style={box}>
        <iframe
          src={videoPlayerUrl(embed)}
          title={label}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          style={fill}
        />
      </div>
    );
  }

  return (
    <button type="button" aria-label={label} onClick={() => setPlaying(true)} style={{ ...box, padding: 0, border: 0, cursor: "pointer" }}>
      {poster ? (
        // A provider cover or the merchant's picture at one fixed size — nothing for `SfImage` to choose between.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" loading="lazy" decoding="async" style={{ ...fill, objectFit: "cover" }} />
      ) : null}
      <span aria-hidden style={play}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
    </button>
  );
}

const frame: CSSProperties = {
  position: "relative",
  display: "block",
  width: "100%",
  overflow: "hidden",
  borderRadius: "var(--radius-lg)",
  background: "#0f172a",
};

const fill: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 };

const play: CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 64,
  height: 64,
  borderRadius: 999,
  background: "rgba(15, 23, 42, 0.72)",
  color: "#ffffff",
};
