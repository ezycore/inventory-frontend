"use client";
// coding-standard: maintained

import Image from "next/image";
import type { ReactNode } from "react";

import { ModeToggle } from "@/components/layout/ThemeToggle/theme-toggle";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { BRAND } from "@/constants/brand";
import { Progress } from "@/ui/components/progress";

/**
 * The frame every setup screen sits in.
 *
 * The wizard renders outside the app shell on purpose — a sidebar of features
 * the merchant has not chosen yet is the thing onboarding exists to avoid — but
 * "no shell" had been read as "no chrome at all", and the screen after the
 * branded signup panel arrived with no logo, no progress and no way to change
 * language or theme. This is the minimum that keeps it recognisably the same
 * product without offering navigation out of a gate that only bounces back.
 *
 * The toggles matter more here than anywhere else in the app: this is the first
 * screen behind the login, so the merchant is still carrying whatever locale
 * and theme the machine happened to have.
 */
export function WizardShell({
  progress,
  progressLabel,
  children,
}: {
  /** 0-100. Omitted on the screens that are not part of the run (welcome, done). */
  progress?: number;
  progressLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/logo/ezycore-mark.svg" alt="" width={26} height={26} />
            <span className="text-base font-semibold tracking-tight">
              {BRAND.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <ModeToggle />
          </div>
        </div>

        {progress !== undefined && (
          <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 pb-3">
            <Progress value={progress} className="h-1" />
            {progressLabel && (
              <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                {progressLabel}
              </span>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 px-4 py-8 sm:py-12">
        {/* The min-height is load-bearing, not padding: the questions carry two
            to four options, so without it the heading and Back button jump
            vertically on every answer. */}
        <div className="mx-auto w-full max-w-xl sm:min-h-[28rem]">
          {children}
        </div>
      </main>
    </div>
  );
}
