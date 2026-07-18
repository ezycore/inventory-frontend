"use client";

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
  campaignSearchConfig,
} from "@/components/ecommerce/campaigns";

function cleanCampaign(data: Record<string, any>) {
  const scope = data.scope;
  const picked =
    scope === "category"
      ? data.categoryTargets
      : scope === "product"
        ? data.productTargets
        : [];
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
        searchConfig={campaignSearchConfig}
        enableSorting
        enableRowHover
        operations={{
          formConfig: campaignFormConfig,
          defaultValues: campaignDefaultValues,
          getAllData: campaignsApi.getAll,
          createMutation: useCreateCampaign(),
          updateMutation: useUpdateCampaign(),
          deleteMutation: useDeleteCampaign(),
          queryKey: ["campaigns"],
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
            categoryTargets: c.scope === "category" ? c.targets ?? [] : [],
            productTargets: c.scope === "product" ? c.targets ?? [] : [],
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
