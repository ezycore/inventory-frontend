"use client";
// coding-standard: maintained

import { useSetStorefrontHomePage, type StorefrontPageListItem } from "@/services/api";
import { EasyAlertDialog } from "@/ui/components/custom/easy-alert-dialog";

/**
 * Confirms using a landing page as the store's homepage — the one action on Pages
 * that changes what every shopper sees first. Stopping needs no confirmation: it
 * brings back the Customize home, which this never changes.
 */
export function HomepageDialog({
  page,
  onClose,
}: {
  page: StorefrontPageListItem | null;
  onClose: () => void;
}) {
  const { mutate, isPending } = useSetStorefrontHomePage();

  return (
    <EasyAlertDialog
      open={page !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Use this page as your homepage?"
      description={`Shoppers who open your store's address will see "${page?.title ?? ""}" instead of the home page you built in Customize. Your Customize home is kept, and comes back when you stop using this page as your homepage.`}
      confirmLabel="Use as homepage"
      confirmClassName=""
      isConfirming={isPending}
      onConfirm={() => {
        if (page) mutate(page._id);
      }}
    />
  );
}
