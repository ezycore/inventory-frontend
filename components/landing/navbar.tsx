"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/ui/components/button";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobile = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/landing" className="font-bold text-xl">
            EasyStock<span className="text-[hsl(185,72%,40%)]">ERP</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8">
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#integrations"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Integrations
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#social-proof"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Testimonials
            </Link>
            <Link
              href="#lead-capture"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex gap-3 items-center">
            <select
              className="appearance-none bg-muted border border-border rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer hover:border-[hsl(185,72%,40%)] transition-colors"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                paddingRight: "1.5rem",
              }}
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="btn-gradient border-0">
                Request a Demo
              </Button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={toggleMobile}
            className="md:hidden p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col gap-2 py-4 border-t border-border">
            <select
              className="appearance-none bg-muted border border-border rounded-lg px-3 py-2 text-xs font-medium cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                paddingRight: "1.5rem",
              }}
            >
              <option value="en">English</option>
              <option value="bn">বাংলা</option>
            </select>
            <Link
              href="#features"
              className="py-3 text-sm font-medium text-muted-foreground"
              onClick={toggleMobile}
            >
              Features
            </Link>
            <Link
              href="#integrations"
              className="py-3 text-sm font-medium text-muted-foreground"
              onClick={toggleMobile}
            >
              Integrations
            </Link>
            <Link
              href="#pricing"
              className="py-3 text-sm font-medium text-muted-foreground"
              onClick={toggleMobile}
            >
              Pricing
            </Link>
            <Link
              href="#social-proof"
              className="py-3 text-sm font-medium text-muted-foreground"
              onClick={toggleMobile}
            >
              Testimonials
            </Link>
            <Link
              href="#lead-capture"
              className="py-3 text-sm font-medium text-muted-foreground"
              onClick={toggleMobile}
            >
              Contact
            </Link>
            <Link href="/signup" onClick={toggleMobile}>
              <Button className="w-full btn-gradient border-0 mt-2">
                Request a Demo
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
