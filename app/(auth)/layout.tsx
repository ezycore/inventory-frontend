// coding-standard: maintained
import type { ReactNode } from "react";

import { ModeToggle } from "@/components/layout/ThemeToggle/theme-toggle";
import {
  AdminRootLayout,
  adminRootMetadata,
} from "@/components/layout/admin-root-layout";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { BRAND } from "@/constants/brand";

// The signed-out pages own the product title. It lives here rather than in the
// shared root metadata because root metadata is re-asserted on every client
// navigation, which made it fight `useOrgDocumentTitle` inside the app (see
// components/layout/admin-root-layout.tsx). Re-asserting is harmless here:
// every page in this tree wants this same value.
export const metadata = {
  ...adminRootMetadata,
  title: BRAND.documentTitle,
};

/**
 * Root layout for the signed-out pages — the `<html>` document comes from
 * `AdminRootLayout`, shared with `(protected)`.
 *
 * Theme and language normally live in the app header, which only mounts behind
 * the protected layout — so before signing in there was no way to change
 * either. The pages inherited whatever the last session left in `localStorage`
 * (theme) and the `NEXT_LOCALE` cookie, which is wrong for a first-time visitor
 * and for a shared machine.
 *
 * Fixed rather than absolute so the cluster survives the scroll on the long
 * signup form. Pages must keep their own top-right corner clear.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRootLayout>
      {children}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3 md:top-6 md:right-6">
        <LocaleToggle />
        <ModeToggle />
      </div>
    </AdminRootLayout>
  );
}
