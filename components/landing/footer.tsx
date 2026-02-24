"use client";

import Link from "next/link";
import { useLandingTranslations } from "@/hooks/use-landing-translations";

export function Footer() {
  const { t } = useLandingTranslations();

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
              {t.footer.tagline}
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
            <h4 className="text-sm font-semibold mb-4">{t.footer.product}</h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href="#features"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.features}
                </Link>
              </li>
              <li>
                <Link
                  href="#integrations"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.integrations}
                </Link>
              </li>
              <li>
                <Link
                  href="#pricing"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.pricing}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.security}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.updates}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold mb-4">{t.footer.resources}</h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.docs}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.apiReference}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.guides}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.community}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.support}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold mb-4">{t.footer.company}</h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href="#trust"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.about}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.careers}
                </Link>
              </li>
              <li>
                <Link
                  href="#lead-capture"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.contact}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.blog}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.press}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold mb-4">{t.footer.legal}</h4>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.terms}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.security}
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-sm text-[hsl(210,40%,98%)]/60 hover:text-[hsl(210,40%,98%)] transition-colors"
                >
                  {t.footer.compliance}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-sm text-[hsl(210,40%,98%)]/50">
            {t.footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
