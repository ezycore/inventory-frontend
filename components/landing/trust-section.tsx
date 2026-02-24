"use client";

import { Shield, Clock, Phone, Lock } from "lucide-react";
import { useLandingTranslations } from "@/hooks/use-landing-translations";

export function TrustSection() {
  const { t } = useLandingTranslations();

  const badges = [
    { icon: Shield, label: t.trust.soc2 },
    { icon: Shield, label: t.trust.gdpr },
    { icon: Shield, label: t.trust.iso },
  ];

  const guarantees = [
    {
      icon: Clock,
      title: t.trust.guarantee1,
      description: t.trust.guarantee1Desc,
    },
    {
      icon: Lock,
      title: t.trust.guarantee2,
      description: t.trust.guarantee2Desc,
    },
    {
      icon: Phone,
      title: t.trust.guarantee3,
      description: t.trust.guarantee3Desc,
    },
  ];

  return (
    <section className="section-padding bg-background" id="trust">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-badge">{t.trust.badge}</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t.trust.title}
            {t.trust.titleAccent && (
              <span className="text-gradient">{t.trust.titleAccent}</span>
            )}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t.trust.subtitle}
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {badges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-5 py-3 rounded-full border border-border bg-card card-shadow"
            >
              <badge.icon className="w-5 h-5 text-[hsl(185,72%,40%)]" />
              <span className="text-sm font-semibold">{badge.label}</span>
            </div>
          ))}
        </div>

        {/* Guarantees */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {guarantees.map((guarantee, index) => (
            <div key={index} className="text-center p-6">
              <div className="w-12 h-12 rounded-lg bg-[hsl(185,72%,40%)]/10 flex items-center justify-center mx-auto mb-4">
                <guarantee.icon className="w-6 h-6 text-[hsl(185,72%,40%)]" />
              </div>
              <h3 className="font-semibold mb-2">{guarantee.title}</h3>
              <p className="text-sm text-muted-foreground">
                {guarantee.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
