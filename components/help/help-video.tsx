// coding-standard: maintained
"use client";

/**
 * The walkthrough video for a help page, when its frontmatter declares one
 * (`video:` → `HelpPage.videoUrl`). Most pages have none, so this renders
 * nothing rather than an empty player — the caller places it above the
 * article body unconditionally and lets it decide.
 *
 * Native `<video>`, not an embed: the videos this exists for are hosted
 * walkthroughs of the app itself, not third-party content, so there is
 * nothing an iframe would buy over a plain player, and no external origin to
 * trust.
 */
export function HelpVideo({ src }: { src: string | null }) {
  if (!src) return null;

  return (
    <video
      key={src}
      controls
      preload="metadata"
      className="mb-4 w-full rounded-lg border bg-black"
    >
      <source src={src} />
    </video>
  );
}
