"use client";
// coding-standard: maintained

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useGetStorefrontSettings, useStorefrontSite } from "@/services/api";
import { CustomizeWorkspace } from "@/components/ecommerce/customize/customize-workspace";

export default function CustomizePage() {
  const { data: settings, isLoading } = useGetStorefrontSettings();
  // A store that publishes its look edits the Site's draft, so Customize waits
  // for it rather than seeding from the settings' stale copy of the look.
  const switched = !!settings?.siteCutoverAt;
  const { data: site, isError: siteFailed } = useStorefrontSite(switched);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customize</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every part of your store, in the order shoppers meet it — with a live
          preview and one Save.
        </p>
      </div>
      {switched && siteFailed ? (
        <p className="text-sm text-destructive">
          Your store&apos;s look could not be loaded. Reload the page to try again.
        </p>
      ) : isLoading || !settings || (switched && !site) ? (
        <PageLoader />
      ) : (
        // useSearchParams (the ?part= deep link) needs a boundary to render.
        <Suspense fallback={<PageLoader />}>
          <CustomizeWorkspace settings={settings} site={switched ? site : undefined} />
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
