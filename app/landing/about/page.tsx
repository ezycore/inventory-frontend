import { SocialProofSection } from "@/components/landing/social-proof-section";
import { TrustSection } from "@/components/landing/trust-section";
import { LeadCaptureSection } from "@/components/landing/lead-capture-section";
import { FileText, BookOpen, Download } from "lucide-react";
import Link from "next/link";

const resources = [
  {
    icon: FileText,
    title: "Case Studies",
    description: "See how SMEs transformed their operations with EasyStockERP.",
    link: "#",
  },
  {
    icon: BookOpen,
    title: "Whitepapers",
    description:
      "In-depth guides on ERP best practices and digital transformation.",
    link: "#",
  },
  {
    icon: Download,
    title: "Product Brochure",
    description: "Download our comprehensive product overview and feature guide.",
    link: "#",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="hero-section pt-32 pb-16">
        <div className="container mx-auto text-center relative z-10">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[hsl(185,72%,40%)] mb-4">
            About Us
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[hsl(210,40%,98%)] leading-tight mb-6 max-w-4xl mx-auto">
            Building the Future of{" "}
            <span className="text-gradient">Business Management</span>
          </h1>
          <p className="text-lg text-[hsl(210,40%,98%)]/70 max-w-2xl mx-auto">
            We&apos;re on a mission to empower growing businesses with the tools they
            need to succeed in the modern economy.
          </p>
        </div>
      </section>

      <SocialProofSection />

      {/* Resources Section */}
      <section className="section-padding bg-background" id="resources">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="section-badge">Resources</span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Learn More About EasyStockERP
            </h2>
            <p className="text-lg text-muted-foreground">
              Explore our library of resources to help you make informed
              decisions.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {resources.map((resource, index) => (
              <Link
                key={index}
                href={resource.link}
                className="block bg-card rounded-xl p-6 card-shadow card-shadow-hover"
              >
                <div className="w-12 h-12 rounded-lg bg-[hsl(185,72%,40%)]/10 flex items-center justify-center mb-4">
                  <resource.icon className="w-6 h-6 text-[hsl(185,72%,40%)]" />
                </div>
                <h3 className="font-semibold mb-2">{resource.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {resource.description}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(185,72%,40%)] transition-all group-hover:gap-2">
                  Explore →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TrustSection />
      <LeadCaptureSection />
    </>
  );
}
