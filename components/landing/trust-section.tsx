import { Shield, Clock, Phone, Lock } from "lucide-react";

const badges = [
  { icon: Shield, label: "GDPR Compliant" },
  { icon: Shield, label: "SOC 2 Type II" },
  { icon: Shield, label: "ISO 27001" },
  { icon: Lock, label: "256-bit Encryption" },
];

const guarantees = [
  {
    icon: Clock,
    title: "99.9% Uptime",
    description: "Enterprise-grade infrastructure with guaranteed availability.",
  },
  {
    icon: Phone,
    title: "24/7 Support",
    description:
      "Dedicated support team available around the clock via chat, email, and phone.",
  },
  {
    icon: Lock,
    title: "Data Security",
    description:
      "Your data is encrypted at rest and in transit with bank-level security protocols.",
  },
];

export function TrustSection() {
  return (
    <section className="section-padding bg-background" id="trust">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-badge">Trust & Security</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Your Data is Safe With Us
          </h2>
          <p className="text-lg text-muted-foreground">
            We take security seriously so you can focus on growing your business.
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
