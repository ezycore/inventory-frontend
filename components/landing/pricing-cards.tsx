import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/ui/components/button";

const pricingPlans = [
  {
    name: "Starter",
    description: "For small teams getting started.",
    price: "$49",
    period: "/user/mo",
    features: [
      "Up to 10 users",
      "Accounting & Invoicing",
      "Inventory basics",
      "Email support",
      "5 GB storage",
    ],
    cta: "Start Free Trial",
    ctaLink: "/signup",
    popular: false,
  },
  {
    name: "Professional",
    description: "For growing businesses that need more.",
    price: "$99",
    period: "/user/mo",
    features: [
      "Up to 50 users",
      "All Starter features",
      "HR & Payroll",
      "Sales CRM",
      "Advanced reporting",
      "API access",
      "Priority support",
    ],
    cta: "Request a Demo",
    ctaLink: "/signup",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For large organizations with complex needs.",
    price: "Custom",
    period: "",
    features: [
      "Unlimited users",
      "All Professional features",
      "Custom integrations",
      "Dedicated account manager",
      "SLA & uptime guarantee",
      "On-premise option",
      "SSO & SAML",
    ],
    cta: "Contact Sales",
    ctaLink: "/contact",
    popular: false,
  },
];

export function PricingCards() {
  return (
    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {pricingPlans.map((plan, index) => (
        <div
          key={index}
          className={`relative bg-card rounded-xl p-8 card-shadow flex flex-col ${
            plan.popular ? "border-2 border-[hsl(185,72%,40%)]" : ""
          }`}
        >
          {plan.popular && (
            <span className="popular-badge">Most Popular</span>
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
