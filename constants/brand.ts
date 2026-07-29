// coding-standard: maintained

const NAME = "EzyCore";

/** Single source for product branding shown in the app UI. */
export const BRAND = {
  name: NAME,
  tagline: "Make life easier",
  /**
   * Default browser-tab title: the root route metadata, and what the workspace
   * restores when it unmounts (see `useOrgDocumentTitle`). Signed-in pages
   * replace it with "<Page> · <Organization>".
   */
  documentTitle: `${NAME} - Inventory Management System`,
} as const;
