"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";
import PageHeader from "@/ui/components/header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/ui/components/tabs";
import { useLocationStockSummary } from "@/services/api/modules/locations/stock-report-hooks";
import { MapPin, TrendingUp } from "lucide-react";
import { OverallStatsBar } from "@/components/locations/stock-report/overall-stats-bar";
import {
  LocationCardSkeleton,
  LocationStockCard,
} from "@/components/locations/stock-report/location-stock-card";
import { LocationDetailView } from "@/components/locations/stock-report/location-detail-view";
import { ComparisonView } from "@/components/locations/stock-report/comparison-view";

export default function LocationStockReportPage() {
  const t = useTranslations("settings.locations.stockReport");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"overview" | "comparison">(
    "overview",
  );
  const { data: summaries, isLoading: summaryLoading } =
    useLocationStockSummary();

  // If a location is selected, show detail view
  if (selectedLocationId) {
    return (
      <div className="space-y-6">
        <LocationDetailView
          locationId={selectedLocationId}
          onBack={() => setSelectedLocationId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
      />

      {/* Overall Stats */}
      <OverallStatsBar
        summaries={summaries || []}
        isLoading={summaryLoading}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "overview" | "comparison")}
      >
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {t("overviewTab")}
          </TabsTrigger>
          <TabsTrigger value="comparison" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            {t("comparisonTab")}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab — Location Cards */}
        <TabsContent value="overview" className="mt-6">
          {summaryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <LocationCardSkeleton key={i} />
              ))}
            </div>
          ) : !summaries || summaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">{t("noLocationsTitle")}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t("noLocationsDescription")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {summaries.map((loc) => (
                <LocationStockCard
                  key={loc.locationId}
                  location={loc}
                  onSelect={setSelectedLocationId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison" className="mt-6">
          <ComparisonView
            summaries={summaries || []}
            isLoading={summaryLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
