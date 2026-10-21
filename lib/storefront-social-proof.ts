// coding-standard: maintained

/**
 * The sold chip, the "Only 3 left" stock chip and the recent-purchase toast — the storefront's half
 * of `docs/plan/social-proof.md` and `docs/plan/related-products-and-stock-left.md` Part B (backend
 * `utils/social-proof.ts` owns the counting and the masking).
 *
 * Pure: types, the look resolver, and the text builders, so the product page, the cards, the
 * toast and the two admin previews all print the same thing.
 */

/** `store.socialProof` — each half present only while its feature is on. */
export interface StoreSocialProof {
  soldCount?: {
    display: "exact" | "rounded";
    label: { en: string; bn: string };
    showOnCards: boolean;
  };
  purchaseToast?: {
    gapSeconds: number;
    staySeconds: number;
    firstDelaySeconds: number;
    maxPerVisit: number;
    template: { en: string; bn: string };
    position: "bottom-left" | "bottom-right";
  };
  /** `label` is already the wording for `display` — exact carries `{count}`, vague does not. */
  stockLeft?: {
    threshold: number;
    display: "exact" | "vague";
    label: { en: string; bn: string };
    showOnCards: boolean;
  };
}

/** One masked toast line from `GET …/recent-purchases`. Absent = the merchant switched it off. */
export interface RecentPurchase {
  name?: string;
  area?: string;
  productName?: string;
  productSlug: string;
  imageUrl?: string;
  minutesAgo?: number;
  timeLabel?: string;
}

export type ShopLang = "en" | "bn";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const bnDigits = (text: string) => text.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

/** Thousands-grouped, in the shop language's digits. */
export function formatCount(n: number, lang: ShopLang): string {
  const grouped = n.toLocaleString("en-US");
  return lang === "bn" ? bnDigits(grouped) : grouped;
}

/**
 * The chip text: the merchant's label with `{count}` filled. A rounded count gets a "+" — the
 * backend floored it, so "40+" is the true claim. A label without `{count}` gets the number in
 * front, so the number can never silently disappear.
 */
export function soldChipText(
  count: number,
  sold: NonNullable<StoreSocialProof["soldCount"]>,
  lang: ShopLang,
): string {
  const number = formatCount(count, lang) + (sold.display === "rounded" ? "+" : "");
  const label = sold.label[lang] || sold.label.en;
  return label.includes("{count}") ? label.replace("{count}", number) : `${number} ${label}`;
}

/**
 * "Only 3 left", or `null` when the chip must not show. One rule for the product page and the cards:
 *
 * - only a counted number — an untracked store's quantity is a sentinel, never a stock level;
 * - only between 1 and the threshold — 0 is the red "Out of stock" badge's job, and a backorder
 *   product at 0 is presented as available, not as nearly gone.
 */
export function stockLeftText(
  stock: StoreSocialProof["stockLeft"],
  available: number | undefined,
  tracked: boolean | undefined,
  lang: ShopLang,
): string | null {
  if (!stock || tracked === false || available == null) return null;
  if (available < 1 || available > stock.threshold) return null;
  const label = stock.label[lang] || stock.label.en;
  if (stock.display === "vague") return label;
  const number = formatCount(available, lang);
  return label.includes("{count}") ? label.replace("{count}", number) : `${number} ${label}`;
}

/** "12 min ago" / "১২ মিনিট আগে" — real orders only; a merchant entry carries its own text. */
export function timeAgoText(minutes: number, lang: ShopLang): string {
  const [n, unit] =
    minutes < 1
      ? [0, "now"]
      : minutes < 60
        ? [minutes, "min"]
        : minutes < 60 * 24
          ? [Math.floor(minutes / 60), "hour"]
          : [Math.floor(minutes / (60 * 24)), "day"];
  if (lang === "bn") {
    if (unit === "now") return "এইমাত্র";
    const word = { min: "মিনিট", hour: "ঘণ্টা", day: "দিন" }[unit];
    return `${bnDigits(String(n))} ${word} আগে`;
  }
  if (unit === "now") return "just now";
  if (unit === "min") return `${n} min ago`;
  return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
}

/** Placeholder a switched-off token reads as, per language. */
const FALLBACK = {
  en: { name: "Someone", area: "", product: "an item" },
  bn: { name: "একজন", area: "", product: "একটি পণ্য" },
} as const;

/**
 * The toast sentence. A token whose field is off falls back to a neutral word ("Someone",
 * "an item"); an empty `{area}` takes the "from" / "থেকে" beside it with it, so the sentence never
 * reads "Rahim from  bought…".
 */
export function toastText(entry: RecentPurchase, template: string, lang: ShopLang): string {
  const fallback = FALLBACK[lang];
  let text = template;
  if (!entry.area) {
    text = text
      .replace(/\s*\bfrom\s+\{area\}/gi, "")
      .replace(/\{area\}\s*থেকে\s*/g, "")
      .replace(/\{area\}\s*/g, "");
  }
  return text
    .replace("{name}", entry.name || fallback.name)
    .replace("{area}", entry.area ?? "")
    .replace("{product}", entry.productName || fallback.product)
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── look (Customize → Social proof) ─────────────────────────────────────────────

/** The raw `templates.*` keys this feature owns. Every one unset = follows the theme. */
export const SOCIAL_LOOK_KEYS = [
  "soldChipStyle",
  "soldChipColor",
  "soldChipSize",
  "soldChipIcon",
  "stockChipColor",
  "stockChipIcon",
  "toastStyle",
  "toastBg",
  "toastText",
  "toastSize",
  "toastRadius",
  "toastImage",
] as const;

export type SocialLookKey = (typeof SOCIAL_LOOK_KEYS)[number];
export type SocialLookRaw = Partial<Record<SocialLookKey, string>>;

export type ChipIcon = "none" | "fire" | "bag" | "clock";

export interface SocialLook {
  chipStyle: "soft" | "solid" | "outline" | "text";
  /** A named swatch or a `#rrggbb`. */
  chipColor: string;
  chipSize: "sm" | "md";
  chipIcon: ChipIcon;
  /** The stock chip shares the style and size above, with its own colour and icon. */
  stockColor: string;
  stockIcon: ChipIcon;
  toastStyle: "light" | "dark" | "brand" | "custom";
  toastBg: string | null;
  toastText: string | null;
  toastSize: "compact" | "normal";
  toastRadius: "theme" | "square" | "rounded" | "pill";
  toastImage: "square" | "round";
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const oneOf = <T extends string>(raw: string | undefined, values: readonly T[], fallback: T): T =>
  raw && (values as readonly string[]).includes(raw) ? (raw as T) : fallback;

export const CHIP_SWATCHES = {
  green: "#15803d",
  red: "#dc2626",
  orange: "#ea580c",
  neutral: "#52525b",
} as const;

/** Pick only this feature's keys out of a templates object (preview payloads carry all of them). */
export function pickSocialLook(templates: Record<string, unknown> | undefined): SocialLookRaw {
  const out: SocialLookRaw = {};
  for (const key of SOCIAL_LOOK_KEYS) {
    const value = templates?.[key];
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/** Raw ids → a look the components can draw; anything unknown falls back like a saved store. */
export function resolveSocialLook(raw: SocialLookRaw | undefined): SocialLook {
  const r = raw ?? {};
  const color = (raw: string | undefined, fallback: string) =>
    raw && (HEX.test(raw) || Object.hasOwn(CHIP_SWATCHES, raw) || raw === "accent") ? raw : fallback;
  return {
    chipStyle: oneOf(r.soldChipStyle, ["soft", "solid", "outline", "text"], "soft"),
    chipColor: color(r.soldChipColor, "accent"),
    chipSize: oneOf(r.soldChipSize, ["sm", "md"], "sm"),
    chipIcon: oneOf(r.soldChipIcon, ["none", "fire", "bag"], "none"),
    stockColor: color(r.stockChipColor, "orange"),
    stockIcon: oneOf(r.stockChipIcon, ["none", "clock", "fire"], "clock"),
    toastStyle: oneOf(r.toastStyle, ["light", "dark", "brand", "custom"], "light"),
    toastBg: r.toastBg && HEX.test(r.toastBg) ? r.toastBg : null,
    toastText: r.toastText && HEX.test(r.toastText) ? r.toastText : null,
    toastSize: oneOf(r.toastSize, ["compact", "normal"], "normal"),
    toastRadius: oneOf(r.toastRadius, ["theme", "square", "rounded", "pill"], "theme"),
    toastImage: oneOf(r.toastImage, ["square", "round"], "square"),
  };
}

// ── contrast ────────────────────────────────────────────────────────────────────

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
};

/** WCAG contrast ratio of two `#rrggbb` colours, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white, whichever reads better on `bg` — the text colour of a solid fill. */
export const readableOn = (bg: string): "#111111" | "#ffffff" =>
  contrastRatio(bg, "#111111") >= contrastRatio(bg, "#ffffff") ? "#111111" : "#ffffff";

/**
 * The storefront tokens the two views read, for drawing them OUTSIDE the shop (the admin previews).
 * The admin defines `--card` / `--primary` for its own dark theme and no `--text` at all, so
 * without these a "light" popup preview drew dark text on the admin's dark card.
 */
export function shopPreviewVars(brand: string): Record<string, string> {
  return {
    "--card": "#ffffff",
    "--text": "#111111",
    "--border": "#e4e4e7",
    "--primary": brand,
    "--primary-soft": `${brand}1f`,
    "--on-primary": readableOn(brand),
  };
}

/**
 * A stand-in product photo for the admin previews, so the Photo setting (square / round) has
 * something to shape. Inline, so a preview never waits on — or breaks with — a network image.
 */
export const SAMPLE_PRODUCT_PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e7d3b4"/><stop offset="1" stop-color="#b98a5b"/></linearGradient></defs><rect width="52" height="52" fill="#f1ece4"/><rect x="11" y="13" width="30" height="26" rx="7" fill="url(#g)"/><rect x="23" y="13" width="6" height="26" fill="#2f6b4f"/></svg>',
  );

/** Below WCAG AA for body text — the custom-colour warning's threshold. */
export const isLowContrast = (fg: string, bg: string) => contrastRatio(fg, bg) < 4.5;
