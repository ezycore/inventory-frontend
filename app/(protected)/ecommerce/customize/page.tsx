"use client";
// coding-standard: maintained

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useGetStorefrontSettings } from "@/services/api";
import { CustomizeWorkspace } from "@/components/ecommerce/customize/customize-workspace";

export default function CustomizePage() {
  const { data: settings, isLoading } = useGetStorefrontSettings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customize</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every part of your store, in the order shoppers meet it — with a live
          preview and one Save.
        </p>
      </div>
      {isLoading || !settings ? (
        <PageLoader />
      ) : (
        // useSearchParams (the ?part= deep link) needs a boundary to render.
        <Suspense fallback={<PageLoader />}>
          <CustomizeWorkspace settings={settings} />
        </Suspense>
      )}
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex min-h-40 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
