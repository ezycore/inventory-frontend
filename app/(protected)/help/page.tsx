// coding-standard: maintained

import { ChevronRightIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import PageContainer from "@/components/layout/page-container";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { helpPagesFor, isHelpLocale } from "@/lib/help/resolve";
import { Card, CardContent } from "@/ui/components/card";
import PageHeader from "@/ui/components/header";

/**
 * Browsable index of the help guides.
 *
 * The header's "?" is the primary way in — it opens the guide for the screen you are on without
 * leaving it. This page exists so the guides have real, shareable URLs: support can send a customer
 * a link, and the in-guide "next step" links resolve to something whether they are followed inside
 * the drawer or in a new tab.
 */
export default async function HelpIndexPage() {
  const rawLocale = await getLocale();
  const locale = isHelpLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = await getTranslations("layout.help");

  return (
    <PageContainer>
      <div className="flex w-full flex-col gap-4">
        <PageHeader title={t("title")} subTitle={t("subtitle")} />

        <div className="grid gap-3 md:grid-cols-2">
          {helpPagesFor(locale).map((page) => (
            <Link key={page.slug} href={`/help/${page.slug}`}>
              <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/40">
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <div className="text-sm font-medium">{page.title}</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {page.summary}
                    </p>
                  </div>
                  <ChevronRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
