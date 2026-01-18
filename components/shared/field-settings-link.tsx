"use client"

import Link from "next/link"
import { Settings2 } from "lucide-react"
import { Button } from "@/ui/components/button"
import { useAuthStore } from "@/stores"

interface FieldSettingsLinkProps {
  module: "product" | "brand" | "category"
}

/**
 * Reusable component that shows a Field Settings button
 * Only visible to users with 'settings.manage' permission
 */
export function FieldSettingsLink({ module }: FieldSettingsLinkProps) {
  const user = useAuthStore((state) => state.user)
  const canManageSettings = user?.permissions?.includes("settings.manage") ?? false

  if (!canManageSettings) {
    return null
  }

  return (
    <Link href={`/settings/fields?tab=${module}`}>
      <Button variant="outline" size="sm">
        <Settings2 className="h-4 w-4 mr-2" />
        Field Settings
      </Button>
    </Link>
  )
}

export default FieldSettingsLink
