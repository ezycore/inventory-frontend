"use client";
// coding-standard: maintained

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Link2, PencilRuler } from "lucide-react";
import { toast } from "sonner";
import { copyText } from "@/utils/clipboard";
import { storefrontUrl } from "@/lib/storefront-url";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { CustomAction } from "@/types/DataTable";
import { orgDayOfInstant } from "@/lib/org-calendar";
import { getOrgTimezone } from "@/hooks/use-org-calendar";
import { queryKeys } from "@/services/api/query-keys";
import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import {
  campaignsApi,
  useCreateCampaign,
  useCreateCampaignPage,
  useDeleteCampaign,
  useUpdateCampaign,
  type Campaign,
} from "@/services/api";
import {
  campaignColumns,
  campaignDefaultValues,
  campaignExclusionsBody,
  campaignExclusionsForm,
  campaignFilterConfig,
  campaignFormConfig,
  CAMPAIGN_TARGET_FIELD,
  type CampaignScope,
} from "@/components/ecommerce/campaigns";

/** Empty target arrays for every scope — the base both transforms build on. */
const emptyTargets = () =>
  Object.fromEntries(
    Object.values(CAMPAIGN_TARGET_FIELD).map((field) => [field, [] as string[]]),
  );

function cleanCampaign(data: Record<string, any>, isEdit: boolean) {
  const scope = data.scope as CampaignScope;
  // Driven by the shared table, so adding a scope cannot leave the fold behind
  // — which is how `subcategory` and `tag` stayed unbuildable: the engine
  // supported them, three of the four places that map scope → field did not.
  const field =
    CAMPAIGN_TARGET_FIELD[scope as keyof typeof CAMPAIGN_TARGET_FIELD];
  const picked = field ? data[field] : [];
  const targets = (Array.isArray(picked) ? picked : []).filter(Boolean);
  return {
    name: String(data.name ?? "").trim(),
    subtitle: String(data.subtitle ?? "").trim(),
    // Blank is sent, not omitted: it is how an edit clears a label.
    cardBadgeLabel: String(data.cardBadgeLabel ?? "").trim(),
    scope,
    type: data.type,
    value: Number(data.value) || 0,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    targets,
    exclude: campaignExclusionsBody(data),
    status: data.status,
    // Create only. The backend refuses it on an update, and sending it there
    // would be a second way to make a page that nothing in the UI offers.
    ...(isEdit ? {} : { createPage: data.createPage === true }),
  };
}

export default function CampaignsPage() {
  const orgSlug = useAuthStore((s) => s.user?.organization?.slug);
  const router = useRouter();
  const createPage = useCreateCampaignPage();

  /**
   * "Copy link" — the campaign's public page (`/campaigns/<slug>`).
   *
   * The whole reason that page exists: a campaign over twenty hand-picked
   * products had nothing a merchant could paste into a Facebook post, because
   * only its categories and tags had public URLs. This is where they get it.
   *
   * Always the tenant subdomain, never the custom domain: a store on its own
   * domain redirects the subdomain to it canonically, so one URL is correct in
   * both cases and this page does not have to load the domain list to find out.
   * Hidden on a campaign with no slug — rows predating the page, until
   * `backfill-slugs` runs — because there is nothing to link to yet.
   */
  const actions = useMemo<CustomAction[]>(
    () => [
      {
        type: "copy-link",
        placement: "cell",
        icon: <Link2 className="h-4 w-4" />,
        tooltip: "Copy campaign link",
        hidden: (row: Campaign) => !row?.slug || !orgSlug,
        onClick: async (row?: Campaign) => {
          if (!row?.slug || !orgSlug) return;
          try {
            await copyText(`${storefrontUrl(orgSlug)}/campaigns/${row.slug}`);
            toast.success("Campaign link copied");
          } catch {
            toast.error("Couldn't copy the link");
          }
        },
      },
      {
        /**
         * The campaign's editable page: open it, or build it for a merchant who
         * said no at create time (or whose campaign predates the feature).
         *
         * One action rather than two, because the answer to "does this campaign
         * have a page" is exactly what the merchant wants to act on — and a
         * disabled second button would explain nothing.
         */
        type: "campaign-page",
        placement: "cell",
        icon: <PencilRuler className="h-4 w-4" />,
        tooltip: "Campaign page",
        hidden: (row: Campaign) => !row?.slug,
        onClick: async (row?: Campaign) => {
          if (!row?._id) return;
          if (row.pageId) {
            router.push(`/ecommerce/pages/${row.pageId}`);
            return;
          }
          const res = await createPage.mutateAsync(String(row._id));
          const id = res.data?.id;
          if (id) router.push(`/ecommerce/pages/${id}`);
        },
      },
    ],
    [orgSlug, createPage, router],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        subTitle="Schedule storewide, category, or product discount campaigns"
      />

      <DataTable<Campaign>
        cardTitle={(n) => `All Campaigns (${n})`}
        columns={campaignColumns}
        defaultPageSize={10}
        pageSizes={[10, 20, 50]}
        filterConfig={campaignFilterConfig}
        customActions={actions}
        enableSorting
        enableRowHover
        operations={{
          formConfig: campaignFormConfig,
          defaultValues: campaignDefaultValues,
          getAllData: campaignsApi.getAll,
          createMutation: useCreateCampaign(),
          updateMutation: useUpdateCampaign(),
          deleteMutation: useDeleteCampaign(),
          queryKey: queryKeys.campaigns.all(),
          entityName: "Campaign",
          editTooltip: "Edit campaign",
          deleteTooltip: "Delete campaign",
          // Row → form values: numeric value, each window bound as the org-local
          // day it names (not the browser's — see orgDayOfInstant),
          // targets array routed to the multi-select matching the scope.
          transformEditData: (c: Campaign) => ({
            name: c.name,
            subtitle: c.subtitle ?? "",
            cardBadgeLabel: c.cardBadgeLabel ?? "",
            scope: c.scope,
            type: c.type,
            value: c.value ?? 0,
            startsAt: orgDayOfInstant(c.startsAt, getOrgTimezone()),
            endsAt: orgDayOfInstant(c.endsAt, getOrgTimezone()),
            // Only the field matching this campaign's scope is filled; the
            // rest stay empty so switching scope in the form starts clean.
            ...emptyTargets(),
            ...(CAMPAIGN_TARGET_FIELD[
              c.scope as keyof typeof CAMPAIGN_TARGET_FIELD
            ]
              ? {
                  [CAMPAIGN_TARGET_FIELD[
                    c.scope as keyof typeof CAMPAIGN_TARGET_FIELD
                  ]]: c.targets ?? [],
                }
              : {}),
            ...campaignExclusionsForm(c),
            status: c.status,
          }),
          // Create → flat CampaignInput; edit → { body } (DataTable injects id),
          // matching useUpdateCampaign's { id, body } signature.
          prepareSubmitData: (data: Campaign, isEdit: boolean) => {
            const body = cleanCampaign(data, isEdit);
            return isEdit ? { body } : body;
          },
        }}
      />
    </div>
  );
}
