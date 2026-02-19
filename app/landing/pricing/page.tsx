import { PricingCards } from "@/components/landing/pricing-cards";
import { LeadCaptureSection } from "@/components/landing/lead-capture-section";

export default function PricingPage() {
  return (
    <>
      <section className="hero-section pt-32 pb-16">
        <div className="container mx-auto text-center relative z-10">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[hsl(185,72%,40%)] mb-4">
            Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[hsl(210,40%,98%)] leading-tight mb-6 max-w-4xl mx-auto">
            Simple, <span className="text-gradient">Transparent</span> Pricing
          </h1>
          <p className="text-lg text-[hsl(210,40%,98%)]/70 max-w-2xl mx-auto">
            Choose the plan that fits your business. No hidden fees, cancel
            anytime.
          </p>
        </div>
      </section>

      <section className="section-padding section-alt" id="pricing">
        <div className="container mx-auto">
          <PricingCards />
        </div>
      </section>

      <LeadCaptureSection />
    </>
  );
}
