"use client";
// coding-standard: maintained

import { useState, type ComponentProps } from "react";

import { sfInput } from "@/components/storefront/field-styles";
import { Icon } from "@/components/storefront/sf-icons";
import { useStorefrontUI } from "@/services/storefront/ui-context";

/** Every `input` prop except the two this component owns. */
export type SfPasswordInputProps = Omit<ComponentProps<"input">, "type" | "style">;

/**
 * The shopper-facing masked field: `sfInput` plus a reveal toggle, so a shopper
 * can check what they typed before submitting. The storefront twin of the
 * admin's `Password` (`ui/components/input-password.tsx`) — it exists
 * separately because this side is skinned with inline styles + CSS variables
 * and reads its labels from the storefront dictionary, not next-intl.
 */
export function SfPasswordInput(props: SfPasswordInputProps) {
  const { t } = useStorefrontUI();
  const [visible, setVisible] = useState(false);

  const label = visible ? t.hidePassword : t.showPassword;

  return (
    <div style={{ position: "relative" }}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        // Reserve the toggle's column — without it a long value runs under it.
        style={{ ...sfInput, paddingRight: 42 }}
      />
      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          alignItems: "center",
          background: "none",
          border: "none",
          padding: 4,
          color: "var(--muted)",
          cursor: "pointer",
        }}
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={18} />
      </button>
    </div>
  );
}
