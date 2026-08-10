"use client";
// coding-standard: maintained

import { useState, type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@ui/lib/utils";
import { Input } from "./input";

/** Everything `Input` takes except `type` — this component owns the type. */
export type PasswordProps = Omit<ComponentProps<"input">, "type">;

/**
 * The one masked field for the whole admin app: `Input` plus a reveal toggle,
 * so a user can check what they typed before submitting. Use it for passwords
 * **and** for any secret shown as dots (API keys, courier credentials) — never
 * hand-roll `type={show ? "text" : "password"}` again.
 *
 * The toggle stays keyboard-reachable and is labelled, because on its own an
 * eye glyph announces as an unnamed button.
 */
function Password({ className, disabled, ...props }: PasswordProps) {
  const t = useTranslations("common.actions");
  const [visible, setVisible] = useState(false);

  const label = visible ? t("hidePassword") : t("showPassword");
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        {...props}
        disabled={disabled}
        type={visible ? "text" : "password"}
        // Reserve the toggle's column — without it a long value runs under it.
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        disabled={disabled}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export { Password };
