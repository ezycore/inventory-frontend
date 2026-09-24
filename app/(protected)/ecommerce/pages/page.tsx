"use client";
// coding-standard: maintained

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/ui/components/button";
import PageHeader from "@/ui/components/header";
import { HomePageCard } from "@/components/ecommerce/pages/home-page-card";
import { NewPageDialog, type NewPageStart } from "@/components/ecommerce/pages/new-page-dialog";
import { PagesList } from "@/components/ecommerce/pages/pages-list";
import { SystemPagesCard } from "@/components/ecommerce/pages/system-pages-card";

/**
 * Every page of the store on one screen.
 *
 * **Ordered by what a merchant works on most.** The home page first — every
 * shopper sees it, and it changes with every season — then their own pages, led
 * by the landing pages their ads send shoppers to. The shop's built-in pages are
 * set once, so they close the phone layout and take the side column from `lg`;
 * the home page stays at the top of the main column there, not in the side.
 *
 * ONE create button for both kinds a merchant makes; the dialog asks which (see
 * `NewPageDialog`). The list's empty states open the same dialog already
 * pointed at a landing page, or at a store page with its name picked.
 */
export default function StorefrontPagesPage() {
  const [creating, setCreating] = useState(false);
  // A fresh dialog per open, so a name picked from the empty state is read anew;
  // kept on close so the dialog animates out instead of remounting.
  const [draft, setDraft] = useState<{ start: NewPageStart; key: number }>({ start: {}, key: 0 });
  const create = (start: NewPageStart = {}) => {
    setDraft((prev) => ({ start, key: prev.key + 1 }));
    setCreating(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pages"
        subTitle="Everything a shopper can open in your store — your own pages, pages for ads, and the shop's built-in pages."
        actions={
          <Button className="h-11 md:h-10" onClick={() => create()}>
            <Plus className="mr-1.5 h-4 w-4" />
            New page
          </Button>
        }
      />

      {/* `minmax(0,1fr)` on the phone too: a bare grid column grows to its widest
          child's min-content — the pill row, a long address — and pushed the
          whole screen wider than the phone. */}
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-5">
          <HomePageCard />
          <PagesList onCreate={create} />
        </div>
        <SystemPagesCard />
      </div>

      <NewPageDialog
        key={draft.key}
        open={creating}
        onOpenChange={setCreating}
        start={draft.start}
      />
    </div>
  );
}
