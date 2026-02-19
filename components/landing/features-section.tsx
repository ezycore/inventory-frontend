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

const features = [
  {
    id: 0,
    icon: Calculator,
    title: "Accounting",
    description:
      "Automate invoicing, track expenses, and manage your general ledger with real-time financial reporting.",
    link: "#lead-capture",
  },
  {
    id: 1,
    icon: Settings,
    title: "Inventory",
    description:
      "Track stock levels, manage warehouses, and optimize your supply chain with demand forecasting.",
    link: "#lead-capture",
  },
  {
    id: 2,
    icon: Users,
    title: "HR & Payroll",
    description:
      "Manage employees, run payroll, and handle benefits—all from a single, integrated platform.",
    link: "#lead-capture",
  },
  {
    id: 3,
    icon: ShoppingCart,
    title: "Sales & CRM",
    description:
      "Track leads, manage pipelines, and close deals faster with built-in CRM and quoting tools.",
    link: "#lead-capture",
  },
  {
    id: 4,
    icon: ClipboardList,
    title: "Procurement",
    description:
      "Streamline purchasing with automated POs, vendor management, and approval workflows.",
    link: "#lead-capture",
  },
  {
    id: 5,
    icon: FileText,
    title: "Reporting",
    description:
      "Build custom reports and dashboards that give you real-time visibility across your entire business.",
    link: "#lead-capture",
  },
];

export function FeaturesSection() {
  const [activeTab, setActiveTab] = useState(0);
  const activeFeature = features[activeTab];

  return (
    <section className="section-padding section-alt" id="features">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-badge">Core Modules</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything Your Business Needs
          </h2>
          <p className="text-lg text-muted-foreground">
            Six powerful modules that work together seamlessly to run your
            operations end to end.
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
              Learn more about {activeFeature.title} →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
