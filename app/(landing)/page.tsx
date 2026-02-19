import { HeroSection } from "@/components/landing/hero-section";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { TrustSection } from "@/components/landing/trust-section";
import { LeadCaptureSection } from "@/components/landing/lead-capture-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <BenefitsSection />
      <FeaturesSection />
      <IntegrationsSection />
      <SocialProofSection />
      <TrustSection />
      <LeadCaptureSection />
    </>
  );
}
