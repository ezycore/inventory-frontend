"use client";

import { Zap, Database, Bot, Smartphone, Shield } from "lucide-react";
import { useLandingTranslations } from "@/hooks/use-landing-translations";

export function BenefitsSection() {
  const { t } = useLandingTranslations();

  const benefits = [
    {
      icon: Zap,
      title: t.benefits.realtime,
      description: t.benefits.realtimeDesc,
    },
    {
      icon: Database,
      title: t.benefits.unified,
      description: t.benefits.unifiedDesc,
    },
    {
      icon: Bot,
      title: t.benefits.automation,
      description: t.benefits.automationDesc,
    },
    {
      icon: Smartphone,
      title: t.benefits.mobile,
      description: t.benefits.mobileDesc,
    },
    {
      icon: Shield,
      title: t.benefits.secure,
      description: t.benefits.secureDesc,
    },
  ];

  return (
    <section className="section-padding bg-background" id="benefits">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-badge">{t.benefits.badge}</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t.benefits.title}
            {t.benefits.titleAccent && (
              <span className="text-gradient">{t.benefits.titleAccent}</span>
            )}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t.benefits.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 card-shadow card-shadow-hover text-center"
            >
              <div className="w-12 h-12 rounded-lg bg-[hsl(185,72%,40%)]/10 flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-6 h-6 text-[hsl(185,72%,40%)]" />
              </div>
              <h3 className="font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
