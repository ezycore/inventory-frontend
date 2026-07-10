"use client";
// coding-standard: maintained

import { OrganizationTab, TransferOwnershipTab } from "@/components/profile";
import { useAuthStore } from "@/services/stores/use-auth-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import PageHeader from "@/ui/components/header";

export default function OrganizationSettingsPage() {
  const user = useAuthStore((state) => state.user);
  const isOwner = !!user && user.organization?.ownerId === user.id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization"
        subTitle="Your organization's name, logo, region, and ownership."
      />

      <Card>
        <CardContent>
          <OrganizationTab />
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer Ownership</CardTitle>
            <CardDescription>
              Hand this organization over to another user. Only the current
              owner can do this.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransferOwnershipTab />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
