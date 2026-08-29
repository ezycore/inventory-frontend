// coding-standard: maintained

import { ArrowLeft } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpMarkdown } from "@/components/help/help-markdown";
import { HelpVideo } from "@/components/help/help-video";
import PageContainer from "@/components/layout/page-container";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { getHelpPage, helpSlugs, isHelpLocale } from "@/lib/help/resolve";

/** Content is baked in at build time, so every guide can be pre-rendered. */
export function generateStaticParams() {
  return helpSlugs().map((slug) => ({ slug }));
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rawLocale = await getLocale();
  const locale = isHelpLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const t = await getTranslations("layout.help");

  const page = getHelpPage(slug, locale);
  if (!page) notFound();

  return (
    <PageContainer>
      <div className="flex w-full max-w-3xl flex-col gap-4">
        <Link
          href="/help"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("allTopics")}
        </Link>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{page.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{page.summary}</p>
        </div>

        <HelpVideo src={page.videoUrl} />
        <HelpMarkdown source={page.body} />
      </div>
    </PageContainer>
  );
}
