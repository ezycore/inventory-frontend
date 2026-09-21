"use client";
// coding-standard: maintained

import dynamic from "next/dynamic";

/**
 * The two frames a cached store page can sit in, each loaded through
 * `next/dynamic` from this client module.
 *
 * That is not style: it is the only way a frame's JavaScript stays off pages
 * that do not render it (plan Spike B). Imported directly into the server
 * `PageFrame`, both would join the route's chunks and a `chrome: "none"` landing
 * page would download the shop's header, menus, search and footer anyway.
 */
export const FullStoreFrame = dynamic(() =>
  import("@/components/storefront/store-shell").then((m) => m.StoreShell),
);

export const BareStoreFrame = dynamic(() =>
  import("@/components/storefront-builder/bare-store-frame").then((m) => m.BareStoreFrame),
);
