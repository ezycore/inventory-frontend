"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/ui/components/button";
import { useLandingTranslations } from "@/hooks/use-landing-translations";

export function PricingCards() {
  const { t } = useLandingTranslations();

  const pricingPlans = [
    {
      name: t.pricing.starter,
      description: t.pricing.starterDesc,
      price: t.pricing.starterPrice,
      period: t.pricing.starterPeriod,
      features: [
        t.pricing.starterFeature1,
        t.pricing.starterFeature2,
        t.pricing.starterFeature3,
        t.pricing.starterFeature4,
        t.pricing.starterFeature5,
      ],
      cta: t.pricing.ctaStart,
      ctaLink: "/signup?planName=Starter",
      popular: false,
    },
    {
      name: t.pricing.growth,
      description: t.pricing.growthDesc,
      price: t.pricing.growthPrice,
      period: t.pricing.growthPeriod,
      features: [
        t.pricing.growthFeature1,
        t.pricing.growthFeature2,
        t.pricing.growthFeature3,
        t.pricing.growthFeature4,
        t.pricing.growthFeature5,
        t.pricing.growthFeature6,
      ],
      cta: t.pricing.ctaStart,
      ctaLink: "/signup?planName=Growth",
      popular: true,
      popularBadge: t.pricing.growthBadge,
    },
    {
      name: t.pricing.enterprise,
      description: t.pricing.enterpriseDesc,
      price: t.pricing.enterprisePrice,
      period: t.pricing.enterprisePeriod,
      features: [
        t.pricing.enterpriseFeature1,
        t.pricing.enterpriseFeature2,
        t.pricing.enterpriseFeature3,
        t.pricing.enterpriseFeature4,
        t.pricing.enterpriseFeature5,
        t.pricing.enterpriseFeature6,
      ],
      cta: t.pricing.ctaContact,
      ctaLink: "#lead-capture",
      popular: false,
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {pricingPlans.map((plan, index) => (
        <div
          key={index}
          className={`relative bg-card rounded-xl p-8 card-shadow flex flex-col ${
            plan.popular ? "border-2 border-[hsl(185,72%,40%)]" : ""
          }`}
        >
          {plan.popular && plan.popularBadge && (
            <span className="popular-badge">{plan.popularBadge}</span>
          )}
          <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {plan.description}
          </p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold">{plan.price}</span>
            <span className="text-sm text-muted-foreground">{plan.period}</span>
          </div>
          <ul className="flex-1 mb-8 space-y-3">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-[hsl(185,72%,40%)] flex-shrink-0 mt-0.5" />
                {feature}
              </li>
            ))}
          </ul>
          <Link href={plan.ctaLink}>
            <Button
              variant={plan.popular ? "default" : "outline"}
              className={`w-full ${plan.popular ? "btn-gradient border-0" : ""}`}
            >
              {plan.cta}
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
