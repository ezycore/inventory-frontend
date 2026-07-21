/**
 * Storefront client — a light fetch wrapper for the PUBLIC storefront API
 * (`/api/storefront/{slug}`). Separate from `lib/api-client.ts`: it carries the
 * SHOPPER token (not the staff token) and never sends `X-Active-Location`.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export interface StorefrontImage {
  url?: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
}

/** One home-page hero slide (owner-managed carousel). */
export interface StoreHeroSlide {
  image?: StorefrontImage | null;
  badge?: string;
  title: string;
  subtitle?: string;
  buttonLabel?: string;
  link?: string;
}

/**
 * Owner overrides for the static banner hero's copy (Classic / Hero Split).
 * Unset fields fall back to the built-in localized copy; button links default
 * to /products. Links are store paths or full URLs (same rules as slide links).
 */
export interface StoreHeroBanner {
  badge?: string;
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryLink?: string;
  secondaryLabel?: string;
  secondaryLink?: string;
}

export interface StorefrontStore {
  name: string;
  slug: string;
  currency?: string;
  logo?: StorefrontImage | null;
  banner?: StorefrontImage | null;
  contact?: { email?: string; phone?: string; address?: string };
  social?: { facebook?: string; instagram?: string; whatsapp?: string };
  seo?: { title?: string; description?: string };
  theme?: {
    preset?: string;
    brandColor?: string;
    accentColor?: string;
    footerText?: string;
    homepageSections?: string[];
  };
  /** Org letterhead (Settings → Receipt & Print) — order invoices print with the
   * same letterhead as every other document. */
  printable?: {
    name?: string;
    address?: string;
    logo?: StorefrontImage | null;
    receiptSettings?: import("@/types/receipt").ReceiptSettings | null;
  } | null;
  allowedPaymentMethods: ("cod" | "bank")[];
  shippingRule: {
    mode: "flat" | "free_over_threshold" | "none";
    flatFee?: number;
    freeThreshold?: number;
  };
  /** Dhaka inside/outside zone rates (override shippingRule when present). */
  shippingZones?: { inside?: number; outside?: number; freeThreshold?: number };
  /** In-store pickup option + the collection location (when enabled). */
  pickup?: {
    enabled: boolean;
    instructions?: string;
    location?: { name: string; address?: string } | null;
  };
  /** Admin-selected page templates (raw ids from the admin Templates tab). */
  templates?: StoreTemplatesRaw;
  /** Owner-editable footer trust badges (Rich footer); undefined → built-in copy. */
  trustBadges?: { text: string; icon?: string }[];
  /** Home hero carousel slides; unset/empty → the static built-in hero. */
  heroSlides?: StoreHeroSlide[];
  /** Static banner-hero copy overrides; unset fields → built-in copy. */
  heroBanner?: StoreHeroBanner;
  /** Header menu / footer groups / announcement bar (admin Navigation tab). */
  nav?: StoreNav;
  /** Checkout behaviour (order prefix, min order, required fields, terms). */
  checkout?: {
    orderPrefix?: string;
    minOrderValue?: number;
    termsRequired?: boolean;
    /** Which address fields the shopper must fill (name/phone/address/area). */
    requiredFields?: string[];
    /** Slug of the CMS content page the terms checkbox links to. */
    termsPageSlug?: string;
  };
  /** Instructions shown to shoppers who pick bank/manual transfer. */
  bankInstructions?: string;
  /** Social sign-in providers with credentials configured on the backend. */
  oauthProviders?: ("google" | "facebook")[];
}

/** Raw per-page template ids as stored by the admin (free strings). */
export interface StoreTemplatesRaw {
  home?: string;
  collection?: string;
  product?: string;
  checkout?: string;
  footer?: string;
  header?: string;
  productCard?: string;
  hero?: string;
  headerMenu?: string;
}

/** What the storefront header's top links are built from. */
export type HeaderMenuSource = "collections" | "custom";

/** Normalized storefront page-layout variants (resolved from the raw admin ids). */
export interface StoreTemplates {
  home: "classic" | "hero-split" | "minimal";
  collection: "grid3" | "grid4" | "sidebar";
  product: "left" | "top" | "sticky";
  checkout: "single" | "multi";
  footer: "columns" | "simple" | "rich";
  header: "classic" | "minimal" | "centered";
  productCard: "standard" | "compact" | "bold";
  /** Home hero source: carousel (when slides exist) vs the static banner hero. */
  hero: "slides" | "banner";
}

/** A header menu link target (category slug, page slug, or URL). */
export interface StoreMenuItem {
  label: string;
  /** "collections" expands to the listed collections at that position (top level only). */
  type: "category" | "page" | "url" | "collections";
  value: string;
  children?: StoreMenuItem[];
}

export interface StoreFooterGroup {
  title: string;
  links: { label: string; url: string }[];
}

/** Owner controls for the auto content-pages footer column. */
export interface StoreFooterContentPages {
  /** `false` hides the column; absent/`true` ⇒ shown. */
  show?: boolean;
  /** Heading override; blank ⇒ the built-in localized "Information" label. */
  title?: string;
}

/** The single-line bar above the storefront header (admin Navigation tab). */
export interface StoreAnnouncement {
  enabled?: boolean;
  text?: string;
  link?: string;
  bgColor?: string;
  /** Explicit text colour; blank ⇒ auto-derived from bgColor for readability. */
  textColor?: string;
  /** Leading emoji/glyph shown before the text. */
  icon?: string;
  /** When set (with a link), renders an explicit CTA button instead of a bare link. */
  ctaLabel?: string;
  /** Shopper can dismiss the bar (persisted per-device until the message changes). */
  dismissible?: boolean;
  size?: "sm" | "md" | "lg";
  /** Background image behind the bar (with the overlay below painted on top). */
  bgImage?: StorefrontImage | null;
  /** Overlay colour painted over the image for text readability. */
  overlay?: string;
  /** Overlay strength, 0–100. */
  overlayOpacity?: number;
  /** cover = photo backdrop (center-cropped); tile = repeating pattern. */
  bgFit?: "cover" | "tile";
}

export interface StoreNav {
  header?: StoreMenuItem[];
  footer?: StoreFooterGroup[];
  /** Owner controls for the auto content-pages footer column. */
  footerContentPages?: StoreFooterContentPages;
  announcement?: StoreAnnouncement;
}

export interface CatalogProduct {
  _id: string;
  name: string;
  slug: string;
  /** For variable products this is the cheapest variant ("From ৳X"). */
  price: number | null;
  /** Original price when an active campaign has discounted this product. */
  compareAtPrice?: number | null;
  basePrice: number | null;
  images: StorefrontImage[];
  description: string;
  featured: boolean;
  categoryId?: string;
  productType: string;
  hasVariants?: boolean;
  availableQuantity: number;
  /** "show"/"hide" cap at stock; "backorder" stays buyable past zero. */
  outOfStockBehavior?: "hide" | "show" | "backorder";
  /** Merchant SEO overrides for the product page (absent when unset). */
  seo?: { title?: string; description?: string };
  /** Present only on the product-detail payload of variable products. */
  variants?: CatalogVariant[];
}

/** One purchasable option of a variable product (e.g. Size "1L"). */
export interface CatalogVariant {
  _id: string;
  label: string;
  attributes: Record<string, string>;
  price: number | null;
  compareAtPrice?: number | null;
  images: StorefrontImage[];
  availableQuantity: number;
}

/** A footer link to a published CMS page. */
export interface ContentPageLink {
  _id: string;
  slug: string;
  title: string;
  sortOrder?: number;
}

/** A published CMS page rendered at /shop/pages/{pageSlug}. */
export interface ContentPageView {
  _id: string;
  slug: string;
  title: string;
  body: string;
  updatedAt?: string;
}

export interface StoreCampaign {
  _id: string;
  name: string;
  banner?: StorefrontImage | null;
  type: string;
  value: number;
  scope: string;
  /** Target ids (category/product scope) — used to build the strip's link. */
  targets?: string[];
  endsAt?: string;
}

export interface CatalogCategory {
  _id: string;
  name: string;
  slug: string;
  /** Collection thumbnail (single image); absent when the merchant set none. */
  image?: StorefrontImage | null;
}

/**
 * One public brand (`GET …/brands`) — auto-curated server-side: active,
 * non-default brands with ≥1 listed product. `productCount` feeds the facet
 * rows and brand tiles.
 */
export interface StoreBrand {
  _id: string;
  name: string;
  slug?: string;
  image?: StorefrontImage | null;
  productCount: number;
}

export interface ProductListResult {
  items: CatalogProduct[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/** Account communication preferences (Notifications section). */
export interface ShopperPrefs {
  promoEmail: boolean;
  orderSms: boolean;
  priceDrop: boolean;
  newsletter: boolean;
}

/** Saved delivery address (account address book). Courier-neutral by design. */
export interface ShopperAddress {
  id?: string;
  label: string;
  line: string;
  phone?: string;
  isDefault: boolean;
  /** Canonical BD district (see `lib/bd-geo.ts`). */
  district?: string;
  /** Area/upazila/thana — free text. */
  area?: string;
}

export interface ShopperProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  /** Birthday as a plain YYYY-MM-DD string. */
  dob?: string;
  prefs?: ShopperPrefs;
  addresses?: ShopperAddress[];
  emailVerified: boolean;
  customerId?: string;
  createdAt?: string;
}

export interface ShopperAuthResult {
  token: string;
  shopper: ShopperProfile;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  /** Street line — omitted for pickup orders (name + phone only). */
  address?: string;
  /** Canonical BD district (courier-neutral). */
  district?: string;
  /** Area/upazila/thana — free text. */
  area?: string;
  zone?: "inside" | "outside";
  notes?: string;
}

export interface StorefrontOrder {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingCharged: number;
  totalAmount: number;
  status: string;
  fulfillmentType?: "delivery" | "pickup";
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: ShippingAddress;
  notes?: string;
  courier?: {
    provider?: string;
    trackingCode?: string;
    consignmentId?: string;
    status?: string;
  };
  createdAt: string;
  statusHistory?: { status: string; at: string }[];
}

export interface PlaceOrderInput {
  items: { productId: string; variantId?: string; quantity: number }[];
  /** Delivery (default) or in-store pickup. Pickup drops the delivery address. */
  fulfillmentType?: "delivery" | "pickup";
  shippingAddress: ShippingAddress;
  paymentMethod: "cod" | "bank";
  notes?: string;
  couponCode?: string;
  /** Shopper accepted the store's terms (required when `checkout.termsRequired`). */
  termsAccepted?: boolean;
}

export interface CouponPreview {
  code: string;
  discountAmount: number;
}

interface FetchOpts {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function sfFetch<T>(
  slug: string,
  path: string,
  opts: FetchOpts = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}/storefront/${slug}${path}`, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // A rejected shopper token means the session is dead (expired/revoked) —
    // drop it so the UI stops rendering a signed-in account it can't back up.
    // Guard on the token still being current so a late 401 can't kill a fresh
    // re-login, and never react to unauthenticated 401s (e.g. wrong password).
    if (res.status === 401 && opts.token) {
      const { useShopperStore } = await import("@/services/stores/use-shopper-store");
      const store = useShopperStore.getState();
      if (store.token === opts.token) store.logout();
    }
    // Error payloads carry the human message in `error` (see backend errorHandler).
    throw new Error(json?.error || json?.message || `Request failed (${res.status})`);
  }
  return json.data as T;
}

/**
 * Full-page navigation target that starts the social sign-in flow. The API
 * handles the whole provider round-trip and bounces back to /account/oauth.
 */
export function oauthStartUrl(
  slug: string,
  provider: "google" | "facebook",
  next?: string,
): string {
  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  return `${API_BASE}/storefront/${slug}/auth/oauth/${provider}/start${q}`;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const storefrontApi = {
  getStore: (slug: string) => sfFetch<StorefrontStore>(slug, ""),
  listProducts: (
    slug: string,
    params: Record<string, string | number | undefined> = {},
  ) => sfFetch<ProductListResult>(slug, `/products${buildQuery(params)}`),
  getProduct: (slug: string, productSlug: string) =>
    sfFetch<CatalogProduct>(slug, `/products/${productSlug}`),
  listCategories: (slug: string) =>
    sfFetch<CatalogCategory[]>(slug, "/categories"),
  listBrands: (slug: string) => sfFetch<StoreBrand[]>(slug, "/brands"),
  listCampaigns: (slug: string) =>
    sfFetch<StoreCampaign[]>(slug, "/campaigns"),
  listPages: (slug: string) =>
    sfFetch<ContentPageLink[]>(slug, "/pages"),
  getPage: (slug: string, pageSlug: string) =>
    sfFetch<ContentPageView>(slug, `/pages/${pageSlug}`),

  register: (
    slug: string,
    body: { name: string; email: string; password: string; phone?: string },
  ) => sfFetch<ShopperAuthResult>(slug, "/auth/register", { method: "POST", body }),
  login: (slug: string, body: { email: string; password: string }) =>
    sfFetch<ShopperAuthResult>(slug, "/auth/login", { method: "POST", body }),
  me: (slug: string, token: string) =>
    sfFetch<ShopperProfile>(slug, "/auth/me", { token }),
  // Account: profile (email/phone are locked server-side), prefs, addresses.
  updateProfile: (
    slug: string,
    token: string,
    body: { name?: string; gender?: "male" | "female" | "other"; dob?: string },
  ) => sfFetch<ShopperProfile>(slug, "/auth/me", { method: "PATCH", body, token }),
  changePassword: (
    slug: string,
    token: string,
    body: { currentPassword: string; newPassword: string },
  ) =>
    sfFetch<{ message: string }>(slug, "/auth/me/password", {
      method: "PUT",
      body,
      token,
    }),
  updatePrefs: (slug: string, token: string, body: Partial<ShopperPrefs>) =>
    sfFetch<ShopperProfile>(slug, "/auth/me/prefs", {
      method: "PUT",
      body,
      token,
    }),
  addAddress: (
    slug: string,
    token: string,
    body: {
      label: string;
      line: string;
      phone?: string;
      isDefault?: boolean;
      district?: string;
      area?: string;
    },
  ) =>
    sfFetch<ShopperProfile>(slug, "/auth/me/addresses", {
      method: "POST",
      body,
      token,
    }),
  updateAddress: (
    slug: string,
    token: string,
    addressId: string,
    body: Partial<{
      label: string;
      line: string;
      phone: string;
      isDefault: boolean;
      district: string;
      area: string;
    }>,
  ) =>
    sfFetch<ShopperProfile>(slug, `/auth/me/addresses/${addressId}`, {
      method: "PATCH",
      body,
      token,
    }),
  deleteAddress: (slug: string, token: string, addressId: string) =>
    sfFetch<ShopperProfile>(slug, `/auth/me/addresses/${addressId}`, {
      method: "DELETE",
      token,
    }),
  verifyEmail: (slug: string, token: string) =>
    sfFetch<{ emailVerified: boolean }>(slug, "/auth/verify-email", {
      method: "POST",
      body: { token },
    }),
  /** Re-send the verification link to the signed-in shopper (session token). */
  resendVerification: (slug: string, token: string) =>
    sfFetch<{ emailVerified: boolean }>(slug, "/auth/resend-verification", {
      method: "POST",
      token,
    }),
  forgotPassword: (slug: string, email: string) =>
    sfFetch<{ message: string }>(slug, "/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),
  resetPassword: (slug: string, token: string, password: string) =>
    sfFetch<{ message: string }>(slug, "/auth/reset-password", {
      method: "POST",
      body: { token, password },
    }),

  placeOrder: (slug: string, token: string, body: PlaceOrderInput) =>
    sfFetch<StorefrontOrder>(slug, "/orders", { method: "POST", body, token }),
  listOrders: (slug: string, token: string) =>
    sfFetch<StorefrontOrder[]>(slug, "/orders", { token }),
  getOrder: (slug: string, token: string, orderNumber: string) =>
    sfFetch<StorefrontOrder>(slug, `/orders/${orderNumber}`, { token }),
  // Shopper self-cancel while the order is still pending.
  cancelOrder: (slug: string, token: string, orderNumber: string) =>
    sfFetch<StorefrontOrder>(slug, `/orders/${orderNumber}/cancel`, {
      method: "POST",
      token,
    }),
  validateCoupon: (
    slug: string,
    token: string,
    body: { code: string; items: { productId: string; quantity: number }[] },
  ) =>
    sfFetch<CouponPreview>(slug, "/coupon/validate", {
      method: "POST",
      body,
      token,
    }),
};
