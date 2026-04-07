"use client";

import { HeroSection } from "@/components/landing/hero-section";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { PricingCards } from "@/components/landing/pricing-cards";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { TrustSection } from "@/components/landing/trust-section";
import { LeadCaptureSection } from "@/components/landing/lead-capture-section";
import { useLandingTranslations } from "@/hooks/use-landing-translations";

export default function HomePage() {
  const { t } = useLandingTranslations();

  return (
    <>
      <HeroSection />
      <BenefitsSection />
      <FeaturesSection />
      <IntegrationsSection />
      
      {/* Pricing Section */}
      <section className="section-padding section-alt" id="pricing">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="section-badge">{t.pricing.badge}</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t.pricing.title}
              {t.pricing.titleAccent && (
                <span className="text-gradient">{t.pricing.titleAccent}</span>
              )}
              {t.pricing.titleEnd}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t.pricing.subtitle}
            </p>
          </div>
          <PricingCards />
        </div>
      </section>
      
      <SocialProofSection />
      <TrustSection />
      <LeadCaptureSection />
    </>
  );
}
