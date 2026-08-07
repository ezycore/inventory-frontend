"use client";

import { queryKeys } from "@/services/api/query-keys";
import { DataTable } from "@/ui/components/dataTable";
import PageHeader from "@/ui/components/header";
import {
  campaignsApi,
  useCreateCampaign,
  useDeleteCampaign,
  useUpdateCampaign,
  type Campaign,
} from "@/services/api";
import {
  campaignColumns,
  campaignDefaultValues,
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

function cleanCampaign(data: Record<string, any>) {
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
    scope,
    type: data.type,
    value: Number(data.value) || 0,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    targets,
    status: data.status,
  };
}

export default function CampaignsPage() {
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
          // Row → form values: numeric value, ISO dates the DatePicker parses,
          // targets array routed to the multi-select matching the scope.
          transformEditData: (c: Campaign) => ({
            name: c.name,
            scope: c.scope,
            type: c.type,
            value: c.value ?? 0,
            startsAt: c.startsAt ?? "",
            endsAt: c.endsAt ?? "",
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
            status: c.status,
          }),
          // Create → flat CampaignInput; edit → { body } (DataTable injects id),
          // matching useUpdateCampaign's { id, body } signature.
          prepareSubmitData: (data: Campaign, isEdit: boolean) => {
            const body = cleanCampaign(data);
            return isEdit ? { body } : body;
          },
        }}
      />
    </div>
  );
}
