"use client";
// coding-standard: maintained

import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useStorefrontPage } from "@/services/api";
import { PageEditor } from "@/components/ecommerce/pages/editor/page-editor";

export default function StorefrontPageEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { data: page, isLoading, isError } = useStorefrontPage(id);

  if (isLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="space-y-2 py-10 text-center">
        <p className="text-sm text-muted-foreground">This page could not be opened. It may have been deleted.</p>
        <Link href="/ecommerce/pages" className="text-sm font-medium text-primary hover:underline">
          Back to Pages
        </Link>
      </div>
    );
  }

  // Keyed by id: opening another page starts a fresh editor instead of carrying
  // this one's sections across.
  return <PageEditor key={page._id} page={page} />;
}
