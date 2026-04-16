"use client";

import { Building2, CreditCard, Package, Truck, Users, BarChart3 } from "lucide-react";
import { useLandingTranslations } from "@/hooks/use-landing-translations";

export function IntegrationsSection() {
  const { t } = useLandingTranslations();

  const departments = [
    { name: t.integrations.finance, icon: CreditCard, color: "finance" },
    { name: t.integrations.sales, icon: Package, color: "sales" },
    { name: t.integrations.operations, icon: Truck, color: "ops" },
    { name: t.integrations.hr, icon: Users, color: "hr" },
    { name: t.integrations.management, icon: BarChart3, color: "mgmt" },
  ];

  const integrations = [
    "Stripe",
    "QuickBooks",
    "Shopify",
    "Slack",
    "Zapier",
    "PayPal",
    "Xero",
    "Salesforce",
  ];

  return (
    <section className="section-padding bg-background" id="integrations">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-badge">{t.integrations.badge}</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t.integrations.title}
            {t.integrations.titleAccent && (
              <span className="text-gradient">{t.integrations.titleAccent}</span>
            )}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t.integrations.subtitle}
          </p>
        </div>

        <div className="bg-card rounded-2xl card-shadow p-8 sm:p-12">
          {/* Hub */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[hsl(215,65%,18%)] to-[hsl(215,55%,28%)] flex items-center justify-center mb-3 text-white">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-lg">{t.integrations.hubLabel}</h3>
            <p className="text-sm text-muted-foreground">{t.integrations.hubDesc}</p>
          </div>

          {/* Departments */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
            {departments.map((dept, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-4 rounded-xl border border-border"
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 dept-icon ${dept.color}`}
                >
                  <dept.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">{dept.name}</span>
              </div>
            ))}
          </div>

          {/* Third-party integrations */}
          <div className="border-t border-border pt-8">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground text-center mb-6">
              {t.integrations.connectsWith}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {integrations.map((integration, index) => (
                <span
                  key={index}
                  className="px-5 py-2.5 rounded-lg border border-border bg-[hsl(210,20%,96%)]/50 text-sm font-medium text-muted-foreground"
                >
                  {integration}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
