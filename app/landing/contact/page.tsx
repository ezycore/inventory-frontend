import { LeadCaptureSection } from "@/components/landing/lead-capture-section";

export default function ContactPage() {
  return (
    <>
      <section className="hero-section pt-32 pb-16">
        <div className="container mx-auto text-center relative z-10">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[hsl(185,72%,40%)] mb-4">
            Get in Touch
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[hsl(210,40%,98%)] leading-tight mb-6 max-w-4xl mx-auto">
            Let's Transform Your{" "}
            <span className="text-gradient">Business Together</span>
          </h1>
          <p className="text-lg text-[hsl(210,40%,98%)]/70 max-w-2xl mx-auto">
            Request a personalized demo and see how EasyStockERP can help your
            business grow.
          </p>
        </div>
      </section>

      <LeadCaptureSection />
    </>
  );
}
