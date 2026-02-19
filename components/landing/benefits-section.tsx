import { Zap, TrendingUp, DollarSign, BarChart3, Users } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Automate Workflows",
    description:
      "Eliminate manual tasks and reduce errors with intelligent process automation.",
  },
  {
    icon: TrendingUp,
    title: "Boost Efficiency",
    description: "Streamline operations and get more done with fewer resources.",
  },
  {
    icon: DollarSign,
    title: "Cut Costs by 40%",
    description:
      "Reduce operational costs by consolidating multiple tools into one.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Insights",
    description:
      "Make data-driven decisions with live dashboards and analytics.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Connect every department with shared data and unified workflows.",
  },
];

export function BenefitsSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="section-badge">Why EasyStockERP</span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for Business Outcomes
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to run smarter, move faster, and grow your
            business with confidence.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 card-shadow card-shadow-hover text-center"
            >
              <div className="w-12 h-12 rounded-lg bg-[hsl(185,72%,40%)]/10 flex items-center justify-center mx-auto mb-4">
                <benefit.icon className="w-6 h-6 text-[hsl(185,72%,40%)]" />
              </div>
              <h3 className="font-semibold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
