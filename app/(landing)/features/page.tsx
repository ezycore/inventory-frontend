import { FeaturesSection } from "@/components/landing/features-section";
import { IntegrationsSection } from "@/components/landing/integrations-section";
import { LeadCaptureSection } from "@/components/landing/lead-capture-section";

export default function FeaturesPage() {
  return (
    <>
      <section className="hero-section pt-32 pb-16">
        <div className="container mx-auto text-center relative z-10">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[hsl(185,72%,40%)] mb-4">
            Complete Feature Set
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[hsl(210,40%,98%)] leading-tight mb-6 max-w-4xl mx-auto">
            Everything Your Business Needs to{" "}
            <span className="text-gradient">Succeed</span>
          </h1>
          <p className="text-lg text-[hsl(210,40%,98%)]/70 max-w-2xl mx-auto">
            Explore our comprehensive suite of modules designed to streamline
            your business operations from end to end.
          </p>
        </div>
      </section>
      <FeaturesSection />
      <IntegrationsSection />
      <LeadCaptureSection />
    </>
  );
}
