"use client";
// coding-standard: maintained

import { useState, type CSSProperties } from "react";
import { toast } from "@/lib/storefront-toast";
import type { ShopperAddress, ShopperProfile } from "@/lib/storefront-client";
import { useShopperAccount } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { Icon } from "@/components/storefront/sf-icons";
import { GeoPicker } from "@/components/storefront/checkout/geo-picker";
import { sfInput as input } from "@/components/storefront/field-styles";
import { brandButton, buttonMetrics } from "@/lib/storefront-button";

type Draft = {
  label: string;
  line: string;
  phone: string;
  isDefault: boolean;
  district: string;
  area: string;
};
const chip = (active: boolean): CSSProperties => ({
  flex: 1,
  border: `1px solid ${active ? "var(--primary)" : "var(--border-strong)"}`,
  background: active ? "var(--primary-soft)" : "var(--surface)",
  color: active ? "var(--primary)" : "var(--text)",
  borderRadius: 8,
  padding: "10px 12px",
  fontFamily: "inherit",
  fontSize: 13.5,
  fontWeight: active ? 700 : 500,
  cursor: "pointer",
});

const emptyDraft: Draft = {
  label: "",
  line: "",
  phone: "",
  isDefault: false,
  district: "",
  area: "",
};

/**
 * Addresses section — the shopper's saved delivery locations. One inline form
 * at a time (adding a new address or editing an existing card).
 */
export function AddressesSection({ shopper }: { shopper: ShopperProfile }) {
  const { slug } = useStoreContext();
  const { t, lang } = useStorefrontUI();
  const { addAddress, updateAddress, deleteAddress } = useShopperAccount(slug);

  // null = closed, "new" = add form, otherwise the id of the card being edited.
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  // Label is a fixed choice (Home/Office/Other); "Other" reveals a free-text name.
  const [otherLabel, setOtherLabel] = useState(false);
  const labelPresets = [t.addrHome, t.addrOffice];
  const addresses = shopper.addresses ?? [];
  const pending = addAddress.isPending || updateAddress.isPending;

  const openNew = () => {
    setDraft(emptyDraft);
    setOtherLabel(false);
    setEditing("new");
  };
  const openEdit = (a: ShopperAddress) => {
    setDraft({
      label: a.label,
      line: a.line,
      phone: a.phone ?? "",
      isDefault: a.isDefault,
      district: a.district ?? "",
      area: a.area ?? "",
    });
    setOtherLabel(!!a.label && !labelPresets.includes(a.label));
    setEditing(a.id ?? null);
  };
  const pickLabel = (preset?: string) => {
    setOtherLabel(!preset);
    setDraft((d) => ({ ...d, label: preset ?? "" }));
  };
  const submit = () => {
    if (!draft.label.trim() || !draft.line.trim()) return;
    const body = {
      label: draft.label.trim(),
      line: draft.line.trim(),
      phone: draft.phone.trim() || undefined,
      isDefault: draft.isDefault,
      district: draft.district,
      area: draft.area,
    };
    const opts = {
      onSuccess: () => {
        setEditing(null);
        toast.success(t.saveChanges);
      },
      onError: (e: Error) => toast.error(e.message),
    };
    if (editing === "new") addAddress.mutate(body, opts);
    else if (editing) updateAddress.mutate({ addressId: editing, ...body }, opts);
  };

  const form = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => pickLabel(t.addrHome)} style={chip(!otherLabel && draft.label === t.addrHome)}>{t.addrHome}</button>
          <button type="button" onClick={() => pickLabel(t.addrOffice)} style={chip(!otherLabel && draft.label === t.addrOffice)}>{t.addrOffice}</button>
          <button type="button" onClick={() => pickLabel()} style={chip(otherLabel)}>{t.addrOther}</button>
        </div>
        {otherLabel ? (
          <input placeholder={t.addressLabelCustom} value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} style={input} />
        ) : null}
      </div>
      <input placeholder={t.addressLine} value={draft.line} onChange={(e) => setDraft((d) => ({ ...d, line: e.target.value }))} style={input} />
      <GeoPicker
        value={{ district: draft.district, area: draft.area }}
        onChange={(g) => setDraft((d) => ({ ...d, district: g.district, area: g.area }))}
        lang={lang}
        labels={{ district: t.selectDistrict, area: t.selectArea, noMatch: t.comboNoMatch }}
      />
      <input placeholder={t.phone} value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} style={input} />
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text)", cursor: "pointer" }}>
        <input type="checkbox" checked={draft.isDefault} onChange={(e) => setDraft((d) => ({ ...d, isDefault: e.target.checked }))} />
        {t.setDefault}
      </label>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          style={{ ...brandButton({ radius: 8, padding: "10px 20px", fontSize: 13.5 }), border: "none", fontFamily: "inherit", fontWeight: 700, cursor: "pointer", opacity: pending ? 0.7 : 1 }}
        >
          {t.saveChanges}
        </button>
        <button
          type="button"
          onClick={() => setEditing(null)}
          style={{ ...buttonMetrics({ radius: 8, padding: "10px 20px", fontSize: 13.5 }), background: "transparent", color: "var(--text)", border: "1px solid var(--border-strong)", fontFamily: "inherit", fontWeight: 600, cursor: "pointer" }}
        >
          {t.cancelEdit}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {addresses.map((a) => (
        <div key={a.id} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ color: "var(--primary)", display: "flex", flex: "none", marginTop: 2 }}>
                <Icon name="mapPin" size={17} />
              </span>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>{a.label}</span>
                  {a.isDefault ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--primary)", background: "var(--primary-soft)", padding: "2px 8px", borderRadius: 999 }}>
                      {t.defaultLabel}
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>{a.line}</div>
                {a.district || a.area ? (
                  <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 2 }}>
                    {[a.area, a.district].filter(Boolean).join(", ")}
                  </div>
                ) : null}
                {a.phone ? (
                  <div className="sf-mono" style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 4 }}>{a.phone}</div>
                ) : null}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flex: "none" }}>
              <button
                type="button"
                aria-label={t.editProfile}
                onClick={() => openEdit(a)}
                style={{ background: "transparent", color: "var(--muted)", border: "1px solid var(--border-strong)", width: 34, height: 34, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="edit" size={15} />
              </button>
              <button
                type="button"
                aria-label={t.removeLabel}
                onClick={() =>
                  deleteAddress.mutate(a.id!, {
                    onSuccess: () => toast.success(t.removeLabel),
                    onError: (e) => toast.error((e as Error).message),
                  })
                }
                style={{ background: "transparent", color: "var(--discount)", border: "1px solid var(--border-strong)", width: 34, height: 34, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          </div>
          {editing === a.id ? form : null}
        </div>
      ))}

      {editing === "new" ? (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700 }}>{t.addNewAddress}</div>
          {form}
        </div>
      ) : (
        <button
          type="button"
          onClick={openNew}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "transparent", color: "var(--primary)", border: "1px dashed var(--border-strong)", borderRadius: 12, padding: 15, fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          <Icon name="plus" size={16} /> {t.addNewAddress}
        </button>
      )}
    </div>
  );
}
