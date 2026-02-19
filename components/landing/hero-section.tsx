import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/ui/components/button";

export function HeroSection() {
  return (
    <section className="hero-section">
      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-[hsl(185,72%,40%)] mb-4">
              All-in-One Business Platform
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[hsl(210,40%,98%)] leading-tight mb-6">
              Run Your Entire Business from{" "}
              <span className="text-gradient">One Platform</span>
            </h1>
            <p className="text-lg text-[hsl(210,40%,98%)]/70 max-w-2xl mb-8">
              Streamline operations, automate workflows, and gain real-time
              visibility across every department — built for growing businesses.
            </p>
            <div className="flex flex-wrap gap-4 mb-8">
              <Link href="/landing/contact">
                <Button size="lg" className="btn-gradient border-0">
                  Request a Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Play className="mr-2 h-4 w-4 fill-white" />
                Watch Overview
              </Button>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-[hsl(210,40%,98%)]/60">
              <span>✓ No credit card required</span>
              <span>✓ 14-day free trial</span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10">
              <Image
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
                alt="EasyStockERP Dashboard showing analytics, inventory and financial overview"
                width={800}
                height={600}
                className="w-full h-auto"
                priority
              />
            </div>
            <div className="hidden sm:flex absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-3 items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[hsl(152,60%,40%)] text-white flex items-center justify-center text-xs font-bold">
                98%
              </div>
              <div>
                <p className="text-xs font-semibold">Uptime SLA</p>
                <p className="text-xs text-muted-foreground">Enterprise-grade</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
