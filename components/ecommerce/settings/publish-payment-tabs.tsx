"use client";
// coding-standard: maintained

import { useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { storefrontUrl } from "@/lib/storefront-url";
import { copyText } from "@/utils/clipboard";
import type { StorefrontPaymentMethod, StorefrontSettings } from "@/types";
import { StorePublishedDialog } from "@/components/ecommerce/store-published-dialog";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Checkbox } from "@/ui/components/checkbox";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import { SaveBar, useStoreSettingsSave } from "./settings-form-shared";

export function PublishSettingsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useStoreSettingsSave();
  const [published, setPublished] = useState(settings.published);
  const [celebrating, setCelebrating] = useState(false);
  const slug = useAuthStore((state) => state.user?.organization?.slug);
  const orgName = useAuthStore((state) => state.user?.organization?.name);
  const hasFavicon = useAuthStore((state) => !!state.user?.organization?.favicon);
  const liveUrl = slug ? storefrontUrl(slug) : null;
  const locationSet = !!settings.storefrontLocationId;
  const copy = async () => {
    if (!liveUrl) return;
    try { await copyText(liveUrl); toast.success("Store URL copied"); }
    catch { toast.error("Couldn't copy the URL"); }
  };
  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5 shadow-none">
        <div className="flex items-center justify-between gap-4"><div><h3 className="text-sm font-semibold">Store status</h3><p className="text-xs text-muted-foreground">When live, customers can browse and place orders.</p></div><Switch checked={published} disabled={!locationSet && !published} onCheckedChange={setPublished} /></div>
        {liveUrl ? <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted px-3 py-2.5"><span className="text-xs text-muted-foreground">Public URL</span><code className="flex-1 break-all text-xs font-semibold">{liveUrl}</code><Button variant="outline" size="sm" onClick={copy}><Copy className="mr-1.5 h-3.5 w-3.5" /> Copy</Button><Button variant="outline" size="sm" asChild><a href={liveUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Visit</a></Button></div> : null}
        <div className={locationSet ? "rounded-lg bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-800 dark:bg-green-500/10 dark:text-green-200" : "rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-200"}>{locationSet ? "✓ Fulfillment location is set — you're ready to publish." : "Set a fulfillment location (General tab) before publishing."}</div>
        {!hasFavicon ? <div className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">No browser tab icon set — your shop will show the EzyCore icon. Add one under Settings → Organization.</div> : null}
      </Card>
      <SaveBar pending={pending} onSave={() => save({ published }, () => { if (published && !settings.published && liveUrl) setCelebrating(true); })} />
      {liveUrl ? <StorePublishedDialog open={celebrating} onOpenChange={setCelebrating} url={liveUrl} storeName={settings.displayName || orgName} /> : null}
    </div>
  );
}

const COMING_SOON = ["bKash", "Nagad", "Card"];

export function PaymentsSettingsTab({ settings }: { settings: StorefrontSettings }) {
  const { save, pending } = useStoreSettingsSave();
  const [methods, setMethods] = useState<StorefrontPaymentMethod[]>(settings.allowedPaymentMethods ?? ["cod"]);
  const [instructions, setInstructions] = useState(settings.bankInstructions ?? "");
  const toggle = (method: StorefrontPaymentMethod, on: boolean) => setMethods((current) => on ? Array.from(new Set([...current, method])) : current.filter((value) => value !== method));
  return (
    <div className="space-y-5">
      <Card className="space-y-3 p-5 shadow-none">
        <div><h3 className="text-sm font-semibold">Payment methods</h3><p className="text-xs text-muted-foreground">How shoppers can pay at checkout.</p></div>
        <label className="flex items-center gap-2.5 text-sm"><Checkbox checked={methods.includes("cod")} onCheckedChange={(value) => toggle("cod", value === true)} />Cash on Delivery</label>
        <label className="flex items-center gap-2.5 text-sm"><Checkbox checked={methods.includes("bank")} onCheckedChange={(value) => toggle("bank", value === true)} />Bank / Manual transfer</label>
        {methods.includes("bank") ? <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} maxLength={600} rows={3} placeholder="Bank transfer instructions shown at checkout…" /> : null}
        <div className="space-y-2 border-t pt-3">{COMING_SOON.map((method) => <label key={method} className="flex cursor-not-allowed items-center gap-2.5 text-sm text-muted-foreground"><Checkbox disabled />{method}<span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Coming soon</span></label>)}</div>
      </Card>
      <SaveBar pending={pending} onSave={() => save({ allowedPaymentMethods: methods.length ? methods : ["cod"], bankInstructions: instructions.trim() || undefined })} />
    </div>
  );
}
