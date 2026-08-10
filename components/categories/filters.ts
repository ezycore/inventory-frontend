import { selectOptions } from "@/services/api/select-options";
import { FilterConfig } from '@/types/DataTable'
import type { Translator } from '@/i18n/config'

export const getCategoryFilterConfig = (t: Translator): FilterConfig => ({
  fields: [
    {
      name: "search",
      label: t("filters.searchLabel"),
      type: "text",
      placeholder: t("filters.searchPlaceholder"),
    },
    {
      // Level of the tree, not a specific parent — "show me only parents" /
      // "only sub-categories". Its own query key (`level`) rather than the
      // `parentId=null|!null` literals the backend also accepts, because a
      // filter panel maps one control to one key and the parent picker below
      // already owns `parentId`.
      name: "level",
      label: t("filters.typeLabel"),
      type: "select",
      placeholder: t("filters.typePlaceholder"),
      options: [
        { label: t("filters.typeParent"), value: "parent" },
        { label: t("filters.typeSub"), value: "sub" },
      ],
      // Picking a level makes any chosen parent either redundant (`sub`) or
      // contradictory (`parent`). The backend lets `parentId` win, so leaving it
      // behind would make the type select look like it did nothing.
      clearFieldsOnChange: ["parentId"],
    },
    {
      // Narrows to one parent's children. Leaving it unset keeps the flat list of
      // every category, parents and children together — the default the backend
      // preserves for exactly this reason.
      name: "parentId",
      label: t("filters.parentLabel"),
      type: "select",
      placeholder: t("filters.parentPlaceholder"),
      optionsApi: selectOptions("categories", {
        parentId: "null",
        fields: "_id,name",
      }),
      // Symmetric to the pair above: naming a parent already implies "sub", so a
      // stale `level` on top of it is at best noise and at worst a contradiction.
      clearFieldsOnChange: ["level"],
    },
    {
      name: "status",
      label: t("filters.statusLabel"),
      type: "select",
      placeholder: t("filters.statusPlaceholder"),
      options: [
        { label: t("filters.statusActive"), value: "active" },
        { label: t("filters.statusInactive"), value: "inactive" },
      ],
    },
    {
      name: "createdAt",
      label: t("filters.createdDateLabel"),
      type: "date-range",
      placeholder: t("filters.createdDatePlaceholder"),
      columnSpan: 2,
    },
    {
      name: "updatedAt",
      label: t("filters.updatedDateLabel"),
      type: "date-range",
      placeholder: t("filters.updatedDatePlaceholder"),
      columnSpan: 2,
    },
  ],
  viewMode: 'popover',
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
});
