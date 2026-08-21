// coding-standard: maintained

export type SocialProfileKey =
  | "facebook"
  | "instagram"
  | "youtube"
  | "threads"
  | "tiktok"
  | "x"
  | "linkedin";

export const SOCIAL_PROFILES = [
  { key: "facebook", label: "Facebook", icon: "facebook", placeholder: "facebook.com/yourpage" },
  { key: "instagram", label: "Instagram", icon: "instagram", placeholder: "@yourhandle" },
  { key: "youtube", label: "YouTube", icon: "youtube", placeholder: "@yourchannel" },
  { key: "threads", label: "Threads", icon: "threads", placeholder: "@yourhandle" },
  { key: "tiktok", label: "TikTok", icon: "tiktok", placeholder: "@yourhandle" },
  { key: "x", label: "X / Twitter", icon: "xSocial", placeholder: "@yourhandle" },
  { key: "linkedin", label: "LinkedIn", icon: "linkedin", placeholder: "company/yourbusiness" },
] as const;

const BASE: Record<SocialProfileKey, string> = {
  facebook: "https://facebook.com/",
  instagram: "https://instagram.com/",
  youtube: "https://youtube.com/@",
  threads: "https://threads.net/@",
  tiktok: "https://tiktok.com/@",
  x: "https://x.com/",
  linkedin: "https://linkedin.com/",
};

export function normalizeSocialProfile(key: SocialProfileKey, raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(value)) return `https://${value}`;
  const handle = value.replace(/^@/, "");
  if (key === "linkedin") {
    return `${BASE.linkedin}${handle.includes("/") ? handle : `in/${handle}`}`;
  }
  return `${BASE[key]}${handle}`;
}

export function socialProfileError(raw: string): string | undefined {
  const value = raw.trim();
  if (!value) return undefined;
  if (/^http:\/\//i.test(value)) return "Use a secure https:// link.";
  if (/^https:\/\/[^\s]+$/i.test(value)) return undefined;
  if (/^@?[a-z0-9][a-z0-9._/-]*$/i.test(value)) return undefined;
  return "Enter an https:// profile URL or a profile handle.";
}
