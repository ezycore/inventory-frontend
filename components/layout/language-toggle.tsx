"use client";
// coding-standard: maintained

import { LanguagesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { useSwitchLocale } from "@/hooks/use-switch-locale";

/** Topbar language switcher — same control the sidebar avatar menu used to own. */
export function LanguageToggle() {
  const { locale, switchLocale } = useSwitchLocale();
  const t = useTranslations("common.language");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="size-8 cursor-pointer"
        >
          <LanguagesIcon />
          <span className="sr-only">{t("label")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Language names always in their own script (docs/I18N.md) */}
        <DropdownMenuCheckboxItem
          checked={locale === "en"}
          onCheckedChange={() => switchLocale("en")}
        >
          {t("english")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={locale === "bn"}
          onCheckedChange={() => switchLocale("bn")}
        >
          {t("bangla")}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
