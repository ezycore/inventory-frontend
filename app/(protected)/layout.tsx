// coding-standard: maintained
import type { ReactNode } from "react";

import {
  AdminRootLayout,
  adminRootMetadata,
} from "@/components/layout/admin-root-layout";
import { ProtectedShell } from "@/components/layout/protected-shell";

export const metadata = { ...adminRootMetadata };

/**
 * Root layout for the signed-in app. The `<html>` document comes from
 * `AdminRootLayout` (shared with `(auth)`); everything about the session —
 * `useMe()`, subscription enforcement, the setup wizard gate, the sidebar —
 * lives in the client `ProtectedShell`.
 */
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AdminRootLayout>
      <ProtectedShell>{children}</ProtectedShell>
    </AdminRootLayout>
  );
}
