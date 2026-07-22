"use client";
// coding-standard: maintained

import { useState, type CSSProperties, type ReactNode } from "react";
import { toast } from "@/lib/storefront-toast";
import type { ShopperProfile } from "@/lib/storefront-client";
import { useShopperAccount } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";
import { PasswordCard } from "@/components/storefront/account/password-card";

const card: CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 22,
};
const fieldLabel: CSSProperties = { fontSize: 12, color: "var(--muted)", marginBottom: 5 };
const fieldValue: CSSProperties = { fontSize: 14.5, fontWeight: 600, color: "var(--text)" };
const input: CSSProperties = {
  width: "100%",
  border: "1px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--text)",
  borderRadius: 8,
  padding: "11px 13px",
  fontFamily: "inherit",
  fontSize: 14,
  outline: "none",
};
const editLabel: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "var(--muted)",
  marginBottom: 7,
};

const GENDERS = ["male", "female", "other"] as const;

/** Green "Verified" pill next to locked contact identifiers. */
function VerifiedPill({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "#16a34a",
        background: "color-mix(in srgb, #16a34a 12%, transparent)",
        padding: "2px 7px",
        borderRadius: 999,
      }}
    >
      {label}
    </span>
  );
}

function LockedField({ label, value, note, mono }: { label: string; value: ReactNode; note: string; mono?: boolean }) {
  return (
    <div>
      <label style={{ ...editLabel, display: "flex", alignItems: "center", gap: 6 }}>
        {label}
        <span style={{ color: "var(--faint)", display: "flex" }}>
          <Icon name="lock" size={14} />
        </span>
      </label>
      <div
        className={mono ? "sf-mono" : undefined}
        style={{ display: "flex", alignItems: "center", border: "1px dashed var(--border-strong)", background: "var(--surface)", color: "var(--muted)", borderRadius: 8, padding: "11px 13px", fontSize: 14 }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 5 }}>{note}</div>
    </div>
  );
}

/**
 * Profile section — view/edit personal details. Email and phone are verified
 * identifiers and stay read-only in both modes (hard product rule; the backend
 * rejects them too).
 */
export function ProfileSection({ shopper }: { shopper: ShopperProfile }) {
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const { updateProfile } = useShopperAccount(slug);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: shopper.name,
    gender: shopper.gender,
    dob: shopper.dob ?? "",
  });

  const startEdit = () => {
    setDraft({ name: shopper.name, gender: shopper.gender, dob: shopper.dob ?? "" });
    setEditing(true);
  };
  const save = () => {
    updateProfile.mutate(
      {
        name: draft.name.trim() || undefined,
        gender: draft.gender,
        dob: draft.dob || undefined,
      },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success(t.profileSaved);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  };

  const genderLabel = shopper.gender ? (t[shopper.gender] as string) : "—";

  return (
    <>
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>{t.personalDetails}</h2>
        {!editing ? (
          <button
            type="button"
            onClick={startEdit}
            style={{ display: "flex", alignItems: "center", gap: 7, background: "var(--primary-soft)", color: "var(--primary)", border: "none", borderRadius: 8, padding: "8px 14px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            <Icon name="edit" size={15} /> {t.editProfile}
          </button>
        ) : null}
      </div>

      {!editing ? (
        <div style={{ display: "grid", gridTemplateColumns: "var(--profcols)", gap: "18px 40px" }}>
          <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
            <div style={fieldLabel}>{t.fullNameLabel}</div>
            <div style={fieldValue}>{shopper.name}</div>
          </div>
          <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
            <div style={fieldLabel}>{t.genderLabel}</div>
            <div style={fieldValue}>{genderLabel}</div>
          </div>
          <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
            <div style={fieldLabel}>{t.dobLabel}</div>
            <div className="sf-mono" style={fieldValue}>{shopper.dob || "—"}</div>
          </div>
          <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
            <div style={{ ...fieldLabel, display: "flex", alignItems: "center", gap: 6 }}>
              {t.emailLabel}
              <span style={{ color: "var(--faint)", display: "flex" }}>
                <Icon name="lock" size={14} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={fieldValue}>{shopper.email}</span>
              {shopper.emailVerified ? <VerifiedPill label={t.verified} /> : null}
            </div>
          </div>
          <div style={{ paddingBottom: 14 }}>
            <div style={{ ...fieldLabel, display: "flex", alignItems: "center", gap: 6 }}>
              {t.phoneLabel}
              <span style={{ color: "var(--faint)", display: "flex" }}>
                <Icon name="lock" size={14} />
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="sf-mono" style={fieldValue}>{shopper.phone || "—"}</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={editLabel}>{t.fullNameLabel}</label>
            <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} style={input} />
          </div>
          <div>
            <label style={editLabel}>{t.genderLabel}</label>
            <div style={{ display: "flex", gap: 8 }}>
              {GENDERS.map((g) => {
                const on = draft.gender === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, gender: g }))}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: 10,
                      borderRadius: 8,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 600,
                      border: on ? "1px solid var(--primary)" : "1px solid var(--border-strong)",
                      background: on ? "var(--primary-soft)" : "var(--card)",
                      color: on ? "var(--primary)" : "var(--text)",
                    }}
                  >
                    {t[g] as string}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label style={editLabel}>{t.dobLabel}</label>
            <input type="date" value={draft.dob} onChange={(e) => setDraft((d) => ({ ...d, dob: e.target.value }))} style={input} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "var(--profcols)", gap: "16px 40px" }}>
            <LockedField label={t.emailLabel} value={shopper.email} note={t.lockedNote} />
            <LockedField label={t.phoneLabel} value={shopper.phone || "—"} note={t.lockedNote} mono />
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button
              type="button"
              onClick={save}
              disabled={updateProfile.isPending}
              style={{ background: "var(--primary)", color: "var(--on-primary)", border: "none", padding: "11px 22px", borderRadius: 8, fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: updateProfile.isPending ? 0.7 : 1 }}
            >
              {t.saveChanges}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              style={{ background: "transparent", color: "var(--text)", border: "1px solid var(--border-strong)", padding: "11px 22px", borderRadius: 8, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              {t.cancelEdit}
            </button>
          </div>
        </div>
      )}
    </div>
    <PasswordCard />
    </>
  );
}
