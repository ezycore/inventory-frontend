"use client";

import { useAuthStore } from "@/services/stores";
import { Button } from "@/ui/components/button";
import { Settings2 } from "lucide-react";
import Link from "next/link";

interface FieldSettingsLinkProps {
  /** Must match a tab key in `app/(protected)/settings/fields/page.tsx`. */
  module: "product" | "brand" | "category" | "tag";
}

/**
 * Reusable component that shows a Field Settings button
 * Only visible to users with 'organization.edit' permission
 */
export function FieldSettingsLink({ module }: FieldSettingsLinkProps) {
  const user = useAuthStore((state) => state.user);
  const canManageSettings =
    user?.permissions?.includes("organization.edit") ?? false;
  if (!canManageSettings) {
    return null;
  }

  return (
    <Link href={`/settings/fields?tab=${module}`} className="hidden sm:block">
      <Button variant="outline" size="sm">
        <Settings2 className="h-4 w-4 mr-2" />
        Field Settings
      </Button>
    </Link>
  );
}

export default FieldSettingsLink;
