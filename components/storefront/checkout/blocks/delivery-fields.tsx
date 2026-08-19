"use client";
// coding-standard: maintained

import { money } from "@/components/storefront/format";
import { input, label as groupLabel } from "@/components/storefront/checkout/checkout-bits";
import { invalidInput } from "@/components/storefront/checkout/checkout-field";
import { LabeledField } from "@/components/storefront/checkout/blocks/labeled-field";
import { CheckoutAddressBook } from "@/components/storefront/checkout/checkout-address-book";
import { GeoPicker } from "@/components/storefront/checkout/geo-picker";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";

/**
 * Where the order goes — the saved-address picker, the street address, the
 * district/area pair, the notes, and the read-only rows derived from them.
 *
 * On a pickup order the whole address collapses to the merchant's collection
 * panel; the notes box survives, because a delivery instruction is still worth
 * saying when you are collecting the parcel yourself.
 */
export function DeliveryFields({
  api,
  showHeading = true,
}: {
  api: CheckoutApi;
  showHeading?: boolean;
}) {
  const {
    t,
    lang,
    store,
    currency,
    addr,
    set,
    geo,
    setGeo,
    savedAddresses,
    selectedId,
    isNew,
    pickSaved,
    pickNew,
    saveNew,
    setSaveNew,
    errors,
    touch,
    isPickup,
    zoned,
    zoneLabel,
    shipping,
  } = api;

  return (
    <div>
      {!isPickup && savedAddresses.length > 0 ? (
        <>
          <div style={groupLabel}>{t.savedAddresses}</div>
          <CheckoutAddressBook
            addresses={savedAddresses}
            selectedId={selectedId}
            isNew={isNew}
            onPick={pickSaved}
            onNew={pickNew}
            labels={{ newAddress: t.newAddress, default: t.default }}
          />
        </>
      ) : null}

      {showHeading ? (
        <div style={groupLabel}>{isPickup ? t.pickupHeading : t.deliveryAddress}</div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {!isPickup ? (
          <>
            <LabeledField name="address" label={t.addressLineLabel} error={errors.address}>
              {(id) => (
                <input
                  id={id}
                  style={errors.address ? invalidInput() : input}
                  aria-invalid={!!errors.address}
                  placeholder={t.addressLine}
                  value={addr.address}
                  onChange={(e) => set("address", e.target.value)}
                  onBlur={() => touch("address")}
                />
              )}
            </LabeledField>
            <GeoPicker
              value={geo}
              onChange={setGeo}
              lang={lang}
              labels={{ district: t.selectDistrict, area: t.selectArea, noMatch: t.comboNoMatch }}
              fieldLabels={{ district: t.districtLabel, area: t.areaLabel }}
              errors={{ district: errors.district, area: errors.area }}
              onBlurField={touch}
            />
          </>
        ) : null}

        <LabeledField label={t.orderNotesLabel} optional={t.optionalTag}>
          {(id) => (
            <input
              id={id}
              style={input}
              placeholder={t.orderNotesPh}
              value={addr.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          )}
        </LabeledField>

        {/* Pickup: show the collection location + any instructions (read-only). */}
        {isPickup && store?.pickup?.location ? (
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 14, background: "var(--surface)" }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 3 }}>{t.pickupFrom}</div>
            <div style={{ fontSize: 14.5, fontWeight: 700 }}>{store.pickup.location.name}</div>
            {store.pickup.location.address ? (
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{store.pickup.location.address}</div>
            ) : null}
            {store.pickup.instructions ? (
              <div style={{ fontSize: 12.5, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>{store.pickup.instructions}</div>
            ) : null}
          </div>
        ) : null}

        {/* Zone fee is derived from the district — shown read-only, not asked. It
            sits on a tinted row rather than as loose text so it reads as a RESULT
            of the field above it, not as another thing to fill in. */}
        {!isPickup && zoned && geo.district ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
              color: "var(--muted)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 13px",
            }}
          >
            <span>
              {t.deliveryZone} · {zoneLabel}
            </span>
            <span className="sf-mono" style={{ color: "var(--text)", fontWeight: 700 }}>
              {shipping === 0 ? t.free : money(shipping, currency)}
            </span>
          </div>
        ) : null}

        {!isPickup && isNew && savedAddresses.length > 0 ? (
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--muted)", cursor: "pointer" }}>
            <input type="checkbox" checked={saveNew} onChange={(e) => setSaveNew(e.target.checked)} />
            {t.saveThisAddress}
          </label>
        ) : null}
      </div>
    </div>
  );
}
