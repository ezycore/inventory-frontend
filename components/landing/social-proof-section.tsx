"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/ui/components/button";
import { useLandingTranslations } from "@/hooks/use-landing-translations";

export function SocialProofSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { t } = useLandingTranslations();

  const metrics = [
    { value: t.social.metric1, label: t.social.metric1Label },
    { value: t.social.metric2, label: t.social.metric2Label },
    { value: t.social.metric3, label: t.social.metric3Label },
    { value: t.social.metric4, label: t.social.metric4Label },
  ];

  const testimonials = [
    {
      quote: t.social.testimonial,
      name: t.social.author,
      role: t.social.role,
    },
  ];

  const clients = [
    "TechVista",
    "GreenLeaf",
    "BrightPath",
    "NovaTech",
    "Meridian",
    "SkyBridge",
    "CoreSync",
    "PeakFlow",
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <section className="section-padding section-alt" id="social-proof">
      <div className="container mx-auto">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-muted-foreground">{metric.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="bg-card rounded-xl card-shadow p-8 sm:p-10 text-center">
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 fill-[hsl(185,72%,40%)] text-[hsl(185,72%,40%)]"
                />
              ))}
            </div>
            <blockquote className="text-lg sm:text-xl font-medium leading-relaxed mb-6">
              &quot;{testimonials[currentTestimonial].quote}&quot;
            </blockquote>
            <div className="font-semibold">
              {testimonials[currentTestimonial].name}
            </div>
            <div className="text-sm text-muted-foreground">
              {testimonials[currentTestimonial].role}
            </div>
          </div>
          <div className="flex justify-center gap-3 mt-6">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Client Logos */}
        <div className="flex flex-wrap justify-center gap-6">
          {clients.map((client, index) => (
            <span
              key={index}
              className="px-6 py-3 rounded-lg border border-border bg-card text-sm font-semibold text-muted-foreground"
            >
              {client}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
