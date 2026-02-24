"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calculator,
  Settings,
  Users,
  ShoppingCart,
  ClipboardList,
  FileText,
} from "lucide-react";
import { useLandingTranslations } from "@/hooks/use-landing-translations";

export function FeaturesSection() {
  const [activeTab, setActiveTab] = useState(0);
  const { t } = useLandingTranslations();

  const features = [
    {
      id: 0,
      icon: Settings,
      title: t.features.inventory,
      description: t.features.inventoryDesc,
      link: "#lead-capture",
    },
    {
      id: 1,
      icon: Users,
      title: t.features.sales,
      description: t.features.salesDesc,
      link: "#lead-capture",
    },
    {
      id: 2,
      icon: Calculator,
      title: t.features.finance,
      description: t.features.financeDesc,
      link: "#lead-capture",
    },
    {
      id: 3,
      icon: ShoppingCart,
      title: t.features.purchasing,
      description: t.features.purchasingDesc,
      link: "#lead-capture",
    },
    {
      id: 4,
      icon: FileText,
      title: t.features.reporting,
      description: t.features.reportingDesc,
      link: "#lead-capture",
    },
  ];

  const activeFeature = features[activeTab];

  return (
    <section className="section-padding section-alt" id="features">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-badge">{t.features.badge}</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t.features.title}
            {t.features.titleAccent && (
              <span className="text-gradient">{t.features.titleAccent}</span>
            )}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Tabs */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {features.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === feature.id
                    ? "bg-[hsl(185,72%,40%)] text-white shadow-lg"
                    : "text-muted-foreground hover:bg-card"
                }`}
              >
                <feature.icon className="w-5 h-5 flex-shrink-0" />
                {feature.title}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-card rounded-xl card-shadow p-8 sm:p-10">
            <div className="flex items-center gap-4 mb-4">
              <activeFeature.icon className="w-8 h-8 text-[hsl(185,72%,40%)]" />
              <h3 className="text-2xl font-bold">{activeFeature.title}</h3>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              {activeFeature.description}
            </p>
            <Link
              href={activeFeature.link}
              className="text-[hsl(185,72%,40%)] font-semibold text-sm hover:underline"
            >
              {t.features.learnMore}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
