// coding-standard: maintained

/**
 * A video link a section may embed, reduced to its provider and what that
 * provider needs. Plan §11: embeds are provider + id from an allowlist — YouTube
 * and Facebook video — never a raw iframe, so any other link embeds nothing.
 *
 * Plain functions, no client code: the section's server view and the registry's
 * emptiness check both ask.
 */
export type VideoEmbed = { provider: "youtube"; id: string } | { provider: "facebook"; href: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
const FACEBOOK_HOSTS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com"]);

const youtube = (id: string | null | undefined): VideoEmbed | null =>
  id && YOUTUBE_ID.test(id) ? { provider: "youtube", id } : null;

export function parseVideoEmbed(link: string | undefined): VideoEmbed | null {
  if (!link) return null;
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") return youtube(parts[0]);
  if (YOUTUBE_HOSTS.has(host)) {
    if (parts[0] === "watch") return youtube(url.searchParams.get("v"));
    return ["shorts", "embed", "live"].includes(parts[0]) ? youtube(parts[1]) : null;
  }
  if (host === "fb.watch") return parts[0] ? { provider: "facebook", href: `https://fb.watch/${parts[0]}/` } : null;
  if (FACEBOOK_HOSTS.has(host)) {
    const watch = parts[0] === "watch" && url.searchParams.has("v");
    if (!watch && !parts.includes("videos") && parts[0] !== "reel") return null;
    const query = watch ? `?v=${encodeURIComponent(url.searchParams.get("v") ?? "")}` : "";
    return { provider: "facebook", href: `https://www.facebook.com${url.pathname}${query}` };
  }
  return null;
}

/** The player's address — loaded only once the shopper presses play. */
export const videoPlayerUrl = (embed: VideoEmbed): string =>
  embed.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${embed.id}?autoplay=1&rel=0`
    : `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(embed.href)}&autoplay=true&show_text=false`;

/** YouTube's own cover picture. Facebook offers none without its API. */
export const videoPosterUrl = (embed: VideoEmbed): string | undefined =>
  embed.provider === "youtube" ? `https://i.ytimg.com/vi/${embed.id}/hqdefault.jpg` : undefined;
