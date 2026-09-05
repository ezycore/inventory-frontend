"use client";
// coding-standard: maintained

import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import PageHeader from '@/ui/components/header'
import { useEffect, useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
import { isFeatureEnabled, isVatActive } from '@/lib/feature-utils'
import { PageTabs, type PageTab } from '@/ui/components/page-tabs'
import { OnlineCatalogPanel } from '@/components/products/online-catalog-panel'
import { queryKeys } from '@/services/api/query-keys'
import { DataTable } from '@/ui/components/dataTable'
import { DataCard } from '@/ui/components/dataCard'
import { productsApi, useProductStats } from '@/services/api'
import { getProductFormConfig } from '@/components/products/form-config'
import { getProductColumns } from '@/components/products/columns'
import { getProductFilterConfig } from '@/components/products/filters'
import { getProductStats, makePrepareSubmitData } from '@/components/products/helpers'
import { useCategoryVatPrefill } from '@/components/products/use-category-vat-prefill'
import { useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/services/api'
import { Sheet, SheetContent } from '@ui/components/sheet'
import { ProductDetail } from '@/components/products/product-detail'
import { FieldSettingsLink } from '@/components/shared/field-settings-link'
import { useFilteredFormConfig, useFilteredColumns, useFeatureGatedColumns } from '@/hooks/use-filters'
import { useVatGatedFormConfig } from '@/hooks/use-vat-gated-form-config'
import StatsCard from '@/ui/components/StatsCard'
import ViewToggle from '@/ui/components/ViewToggle'
import { useViewMode } from '@/hooks/use-view-mode'
import { ProductCard } from '@/components/products/product-card'
import MountingHandler from '@/components/MountingHandler';
import { useAuthStore } from '@/services/stores';
import { BarcodeLabelSheet, type LabelItem } from '@/components/shared/barcode';
import { toast } from 'sonner';
import { ProductStatus } from '@/types'
import type { AppLocale } from '@/i18n/config'

export default function ProductsPage() {
  const t = useTranslations('products.products')
  const locale = useLocale() as AppLocale
  const sortingConfig = {
    sortOptions: [
      { field: "name", label: t('page.sortName') },
      { field: "price", label: t('page.sortPrice') },
      { field: "status", label: t('page.sortStatus') },
    ],
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc" as const,
  }
  // The Online tab is a listing view over these same product records — not a
  // second catalog — so it belongs here rather than as its own sidebar entry
  // (docs/plan/onboarding-workspace.md §6.3). It needs the storefront feature
  // AND the permission: a staff member without storefront access must not get a
  // tab that 403s on click.
  //
  // `?tab=online` makes it linkable: the ecommerce dashboard's "Online products
  // live" tile points here, and there is no other route to the online listing
  // since /ecommerce/catalog was removed. Read once as the initial value — the
  // strip owns the tab after that, so switching tabs does not rewrite the URL.
  const initialTab = useSearchParams().get('tab') === 'online' ? 'online' : 'all'
  const [tab, setTab] = useState<'all' | 'online'>(initialTab)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [labelSheet, setLabelSheet] = useState<{ open: boolean; items: LabelItem[] }>({ open: false, items: [] })
  const [viewMode, setViewMode, isMounted] = useViewMode('products')
  const filteredFormConfig = useFilteredFormConfig(getProductFormConfig(t), 'product')
  const filteredColumns = useFilteredColumns(getProductColumns(t), 'product')
  // Feature-gated full list: barcode is stripped when the org has no barcode
  // system, so the "manage columns" picker can't bring it back.
  const fullProductColumns = useFeatureGatedColumns(getProductColumns(t), 'product')
  const productFilterConfig = getProductFilterConfig(t)
  const { data: statsData, isLoading: statsLoading } = useProductStats()
  const { user, activeLocationId } = useAuthStore();

  // Hide the product tax-config fields while the org doesn't charge VAT. The
  // standalone Tax section holds nothing else, so it disappears with them.
  const taxGatedFormConfig = useVatGatedFormConfig(filteredFormConfig, 'product')
  // Combo feature gate: when off, strip the "combo" product-type option and drop
  // the Combo composition section (leaves single/variable untouched).
  const comboEnabled = !!user?.organization?.features?.combo;
  const gatedFormConfig = useMemo(() => {
    if (comboEnabled) return taxGatedFormConfig;
    const cfg = taxGatedFormConfig as { sections?: any[]; fields?: any[] };
    const stripComboOption = (field: any) =>
      field.name === "productType" && Array.isArray(field.options)
        ? { ...field, options: field.options.filter((o: any) => o.value !== "combo") }
        : field;
    if (!cfg.sections) return taxGatedFormConfig;
    return {
      ...taxGatedFormConfig,
      sections: cfg.sections
        .map((s) => ({
          ...s,
          fields: (s.fields || [])
            .filter((f: any) => f.name !== "comboComponents")
            .map(stripComboOption),
        }))
        .filter((s) => (s.fields || []).length > 0),
    };
  }, [taxGatedFormConfig, comboEnabled]);

  const barcodeEnabled = user?.organization?.features?.barcodeSystem;

  // The Online tab manages a decision some tiers do not have.
  //
  // Listing is a separate act from stocking only when the two can diverge. A
  // storefront merchant who tracks stock decides what to put online and when,
  // so the tab is the screen for it. A storefront merchant who does NOT track
  // stock has no such choice — `useFilteredFormConfig` already strips
  // `isListed`/`onlinePrice`/`onlineDescription` from their product form on the
  // grounds that "creating a product IS publishing it" — and leaving the tab up
  // handed them a second, contradicting place to make a decision the form had
  // just told them they do not make (QA-C3).
  //
  // This is deliberately NOT the "unify the two tables" fix the report asked
  // for. The Online panel is a projection, not a rival catalogue: it sorts
  // featured-first on purpose (`catalog.service.ts`) and its columns carry
  // fields — listed, online price, featured, block reason — that do not exist on
  // a product row. Merging them would flatten a real distinction. Removing the
  // tab where the distinction is not real is the actual defect.
  const showOnlineTab =
    isFeatureEnabled(user?.organization?.features, 'storefront') &&
    user?.organization?.features?.inventoryTracking !== false &&
    (user?.permissions?.includes('storefront.view') ?? false);

  // Clamp rather than trust the raw state: PageTabs renders nothing when it is
  // down to one tab, so a merchant sitting on Online when the storefront is
  // switched off would keep staring at the online panel with no tab strip left
  // to click back through. Derived, not an effect — there is no frame showing
  // the stranded panel.
  const activeTab = showOnlineTab ? tab : 'all'

  const productTabs: readonly PageTab<'all' | 'online'>[] = useMemo(
    () =>
      showOnlineTab
        ? ([
            { key: 'all', label: t('page.tabs.all') },
            { key: 'online', label: t('page.tabs.online') },
          ] as const)
        : ([{ key: 'all', label: t('page.tabs.all') }] as const),
    [showOnlineTab, t],
  );

  const openLabelsFor = (rows: any[]) => {
    const items: LabelItem[] = [];
    for (const row of rows) {
      // Variable products: print one label per variant w/ barcode
      if (row.productType === "variable" && Array.isArray(row.variants)) {
        for (const v of row.variants) {
          if (v.barcode) {
            items.push({
              code: v.barcode,
              name: `${row.name} (${Object.values(v.attributes || {}).join("/")})`,
              price: v.price,
              symbology: v.barcodeSymbology || "CODE128",
            });
          }
        }
      } else if (row.barcode) {
        items.push({
          code: row.barcode,
          name: row.name,
          price: row.price,
          symbology: row.barcodeSymbology || "CODE128",
        });
      }
    }
    if (items.length === 0) {
      toast.error(t("page.noBarcodes"));
      return;
    }
    setLabelSheet({ open: true, items });
  };

  // Category → VAT-rate prefill on the create form (no-op when VAT is off).
  const handleFieldChange = useCategoryVatPrefill(isVatActive(user?.organization))

  // Product stats (only product-relevant data, no inventory stats)
  const productStats = getProductStats(statsData, t)

  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()

  // A product with an inventory row (even at qty 0) can't be deleted —
  // backend PRODUCT_IN_USE — and archiving is the intended alternative, but
  // nothing pointed the merchant at it: the delete just dead-ended on the
  // generic error toast. Offer the one-click alternative right there.
  useEffect(() => {
    if (!deleteMutation.isError) return
    const code = (deleteMutation.error as { code?: string } | undefined)?.code
    if (code !== 'PRODUCT_IN_USE') return
    const productId = deleteMutation.variables as string | undefined
    if (!productId) return

    toast(t('page.inUseTitle'), {
      description: t('page.inUseDescription'),
      action: {
        label: t('page.inUseArchiveAction'),
        onClick: () =>
          updateMutation.mutate({ id: productId, status: ProductStatus.ARCHIVED }),
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-check on a new delete error
  }, [deleteMutation.isError, deleteMutation.error, deleteMutation.variables])

  // ONE array, handed to BOTH branches below.
  //
  // The table and the card are two components rendered behind a ViewToggle off
  // the same page, and this used to be an inline literal on the table alone —
  // so Print Label existed in table view and silently did not in card view,
  // with `useViewMode` remembering the merchant's choice (QA-T1-E). Declaring
  // it here rather than twice is the point: two literals kept in sync is the
  // same defect waiting to come back on the next edit.
  const rowActions = barcodeEnabled
    ? [
        {
          type: "print-label",
          placement: "cell" as const,
          icon: <Printer className="h-4 w-4" />,
          tooltip: t("page.printLabel"),
          onClick: (row: any) => openLabelsFor([row]),
          disabled: (row: any) =>
            !row.barcode &&
            !(
              row.productType === "variable" &&
              (row.variants || []).some((v: any) => v.barcode)
            ),
        },
      ]
    : undefined;

  // Shared operations config
  const sharedOperations = {
    formConfig: gatedFormConfig,
    getAllData: productsApi.getAll,
    createMutation: useCreateProduct(),
    updateMutation,
    deleteMutation,
    defaultValues: { locationId: activeLocationId },
    isViewAvailable: false,
    queryKey: queryKeys.products.all(),
    entityName: t("page.entity"),
    openInside: "drawer" as const,
    disabledFieldsInEdit: ["productType"],
    onFieldChange: handleFieldChange,
    editTooltip: t("page.editTooltip"),
    deleteTooltip: t("page.deleteTooltip"),
    transformEditData: (item: any) => {
      const transformedVariants =
        item.variants?.map((variant: any) => {
          const attributeKey = Object.keys(variant.attributes || {})[0]
          const attributeValue = variant.attributes?.[attributeKey]
          return {
            id: variant._id || `${attributeKey}-${attributeValue}`,
            _id: variant._id,
            attributeName: attributeKey || "",
            value: attributeValue || "",
            price: variant.price || 0,
            enabled: variant.status === "active",
            images: variant.images || [],
            enableUOMConversion: !!variant.enableUOMConversion,
            purchaseUnit: variant.purchaseUnit
              ? { unitId: variant.purchaseUnit.unitId, conversionFactor: variant.purchaseUnit.conversionFactor }
              : undefined,
            saleUnit: variant.saleUnit
              ? { unitId: variant.saleUnit.unitId, conversionFactor: variant.saleUnit.conversionFactor }
              : undefined,
            barcode: variant.barcode,
            inventoryAlertLevel: variant.inventoryAlertLevel,
          }
        }) || []
      return {
        ...item,
        // Barcode type is product-level and shared by all variants. Legacy variable
        // products stored it per variant only — fall back to the first variant so
        // the shared "Barcode type" field prefills correctly on edit.
        barcodeSymbology: item.barcodeSymbology || item.variants?.[0]?.barcodeSymbology,
        // "Publish to store" is flat on the form and nested on the document, so
        // the spread above reaches none of it. Left unflattened the three fields
        // render empty on edit — and because the submit path sends anything that
        // is not `undefined`, an untouched checkbox goes out as
        // `isListed: false`. Renaming a product would take it off the storefront,
        // with no error and nothing on screen to suggest it happened.
        //
        // `?? undefined`, never `?? false` or `?? ""`: absent must stay absent
        // so the submit path omits it rather than writing a blank over a value
        // this form was not shown.
        isListed: item.storefront?.isListed ?? undefined,
        onlinePrice: item.storefront?.onlinePrice ?? undefined,
        onlineDescription: item.storefront?.onlineDescription ?? undefined,
        // Same rule, same reason: this tier has no Online tab, so the form owns
        // these two now. Unhydrated, an untouched "Feature on the homepage"
        // checkbox would go out `false` on every edit and quietly un-feature the
        // product, and the weight field would blank a real parcel weight.
        featured: item.storefront?.featured ?? undefined,
        weightKg: item.storefront?.weightKg ?? undefined,
        variants: transformedVariants,
      }
    },
    prepareSubmitData: makePrepareSubmitData(t),
  }

 if(!isMounted) {
    return <MountingHandler />
  }

  return (
    <div className="container mx-auto space-y-6">
      <PageHeader
        title={t("page.title")}
        subTitle={t("page.subtitle")}
        actions={
          <div className="flex items-center gap-3">
            {/* Table/card is a choice about the product list; the Online tab has
                its own single layout, so the toggle would do nothing there. */}
            {activeTab === 'all' && (
              <ViewToggle
                storageKey="products"
                defaultView={viewMode}
                onChange={setViewMode}
              />
            )}
            <FieldSettingsLink module="product" />
          </div>
        }
      />

      {/* Stats Cards */}
      <StatsCard
        data={productStats}
        isLoading={statsLoading}
        columns={{ default: 1, lg: productStats.length }}
      />

      <PageTabs<'all' | 'online'> tabs={productTabs} active={activeTab} onChange={setTab} />

      {activeTab === 'online' && <OnlineCatalogPanel />}

      {/* Table View */}
      {activeTab === 'all' && viewMode === 'table' && (
        <DataTable
          cardTitle={t("page.allProductsTitle")}
          columns={filteredColumns}
          fullColumns={fullProductColumns}
          selectable={true}
          manageColumns={true}
          module="product"
          variant="card"
          stickyHeader={true}
          filterConfig={productFilterConfig}
          operations={sharedOperations}
          enableSorting={true}
          sortingConfig={sortingConfig}
          enableRowHover={true}
          exportConfig={{
            download: (params) => productsApi.exportCsv(params),
            note: t("page.exportNote"),
          }}
          importConfig={{
            downloadTemplate: productsApi.downloadImportTemplate,
            preview: productsApi.importPreview,
            commit: productsApi.importCommit,
          }}
          {...(rowActions ? { customActions: rowActions } : {})}
        />
      )}

      {/* Card View */}
      {activeTab === 'all' && viewMode === 'card' && (
        <DataCard
          cardTitle={t("page.allProductsTitle")}
          defaultPageSize={12}
          pageSizes={[12, 24, 48]}
          layoutConfig={{
            layout: 'grid',
            columns: { default: 1, sm: 2, md: 3, lg: 4 },
            gap: 'md',

          }}
          sortingConfig={sortingConfig}
          variant="default"
          enableCardHover={true}
          filterConfig={productFilterConfig}
          exportConfig={{
            download: (params) => productsApi.exportCsv(params),
            note: t("page.exportNote"),
          }}
          importConfig={{
            downloadTemplate: productsApi.downloadImportTemplate,
            preview: productsApi.importPreview,
            commit: productsApi.importCommit,
          }}
          {...(rowActions ? { customActions: rowActions } : {})}
          renderCard={(row: any, actions) => (
            <ProductCard
              product={row}
              onEdit={actions.onEdit}
              onView={() => setSelectedProductId(row._id)}
              onDelete={actions.onDelete}
              customActions={actions.customActions}
            />
          )}
          operations={sharedOperations}
        />
      )}

      <Sheet
        open={!!selectedProductId}
        onOpenChange={(open) => !open && setSelectedProductId(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl lg:max-w-4xl overflow-y-auto p-6"
        >
          {selectedProductId && (
            <ProductDetail
              productId={selectedProductId}
              onClose={() => setSelectedProductId(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <BarcodeLabelSheet
        open={labelSheet.open}
        onOpenChange={(v) => setLabelSheet((s) => ({ ...s, open: v }))}
        items={labelSheet.items}
        storeName={user?.organization?.name}
      />
    </div>
  )
}
