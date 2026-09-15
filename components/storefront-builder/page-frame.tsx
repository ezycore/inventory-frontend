// coding-standard: maintained
import type { ReactNode } from "react";
import type { StorefrontStore } from "@/lib/storefront-client";
import type { StorefrontReads } from "@/lib/storefront-server";
import type { StorefrontPublicPage } from "@/types/api";
import { StoreHead } from "@/components/storefront/store-head";
import { BareStoreFrame, FullStoreFrame } from "@/components/storefront-builder/frames";

export type PageChrome = NonNullable<StorefrontPublicPage["page"]>["chrome"];

/**
 * The chrome around a store page, chosen by the page itself (plan §5.4):
 *
 *  - `full`    — the shop's own shell: header, nav, footer, phone tab bar.
 *  - `minimal` — a logo bar that links home, and nothing else.
 *  - `none`    — no header and no footer.
 *
 * `minimal` and `none` pay for none of the shell: not its JavaScript (see
 * `frames.tsx`) and not its data — the footer pages, campaigns and category tree
 * are fetched for `full` only. Every mode keeps what makes the page part of the
 * shop: the tab icon, the Meta Pixel, the merchant's colours and type, and the
 * cart.
 *
 * It reads through `reads`: `publicStorefront` inside the cached route, which
 * must never read the request, and the request-aware set in owner preview, so a
 * draft is framed exactly as it will be once published.
 */
export async function PageFrame({
  chrome,
  reads,
  slug,
  base,
  store,
  children,
}: {
  chrome: PageChrome;
  reads: StorefrontReads;
  slug: string;
  base: string;
  store: StorefrontStore;
  children: ReactNode;
}) {
  if (chrome !== "full") {
    return (
      <>
        <StoreHead slug={slug} store={store} />
        <BareStoreFrame slug={slug} base={base} store={store} logoBar={chrome === "minimal"}>
          {children}
        </BareStoreFrame>
      </>
    );
  }

  const [pages, campaigns, categories] = await Promise.all([
    reads.getStorePages(slug),
    reads.getStoreCampaigns(slug),
    reads.getStoreCategories(slug),
  ]);

  return (
    <>
      <StoreHead slug={slug} store={store} />
      <FullStoreFrame
        slug={slug}
        base={base}
        initialStore={store}
        initialPages={pages ?? undefined}
        initialCampaigns={campaigns ?? undefined}
        initialCategories={categories ?? undefined}
      >
        {children}
      </FullStoreFrame>
    </>
  );
}
