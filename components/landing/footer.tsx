import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[hsl(215,65%,22%)] text-[hsl(210,40%,98%)] py-16">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="font-bold text-xl mb-4">
              EasyStock<span className="text-[hsl(185,72%,40%)]">ERP</span>
            </div>
            <p className="text-sm text-[hsl(210,40%,98%)]/60 leading-relaxed mb-6">
              The all-in-one ERP platform built for small to medium enterprises.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-xs font-medium"
              >
                T
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-xs font-medium"
              >
                L
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-xs font-medium"
              >
                G
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Product</h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href="/features"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#integrations"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Integrations
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Security
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  What&apos;s New
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Resources</h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Case Studies
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Whitepapers
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  API Docs
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Company</h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Partners
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Press
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4">Legal</h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  GDPR
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  SLA
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-sm text-[hsl(210,40%,98%)]/50">
            © 2026 EasyStockERP. All rights reserved.
          </p>
          <p className="text-sm text-[hsl(210,40%,98%)]/50">
            Made with precision for growing businesses.
          </p>
        </div>
      </div>
    </footer>
  );
}
