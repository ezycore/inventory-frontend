"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";

export function LeadCaptureSection() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <section className="hero-section py-16 sm:py-20" id="lead-capture">
      <div className="container-narrow mx-auto relative z-10">
        <div className="bg-card rounded-2xl shadow-2xl p-8 sm:p-12 max-w-2xl mx-auto">
          {!isSubmitted ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  Request a Personalized Demo
                </h2>
                <p className="text-lg text-muted-foreground">
                  See how EasyStockERP can transform your business operations.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder="Full Name"
                    required
                    className="h-12"
                  />
                  <Input
                    type="email"
                    placeholder="Work Email"
                    required
                    className="h-12"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder="Company Name"
                    required
                    className="h-12"
                  />
                  <Input
                    type="text"
                    placeholder="Job Title"
                    className="h-12"
                  />
                </div>
                <Button type="submit" className="w-full h-12 btn-gradient border-0">
                  Book My Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  We respect your privacy. No spam, unsubscribe anytime.
                </p>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-[hsl(152,60%,40%)]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[hsl(152,60%,40%)]" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
              <p className="text-muted-foreground">
                We&apos;ll be in touch within 24 hours to schedule your demo.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
