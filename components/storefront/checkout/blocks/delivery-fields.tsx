"use client";
// coding-standard: maintained

import { money } from "@/components/storefront/format";
import { input, label as groupLabel } from "@/components/storefront/checkout/checkout-bits";
import { invalidInput } from "@/components/storefront/checkout/checkout-field";
import { LabeledField } from "@/components/storefront/checkout/blocks/labeled-field";
import { CheckoutAddressBook } from "@/components/storefront/checkout/checkout-address-book";
import { CustomFields } from "@/components/storefront/checkout/blocks/custom-fields";
import { GeoPicker } from "@/components/storefront/checkout/geo-picker";
import type { CheckoutApi } from "@/components/storefront/checkout/use-checkout";
import { deliveryEstimateForZone } from "@/lib/storefront-delivery";

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
    zone,
    zoneLabel,
    shipping,
    isFlatAddress,
    inference,
    needsZoneChoice,
    zoneChoice,
    setZoneChoice,
  } = api;
  const deliveryEstimate = deliveryEstimateForZone(store, zone);

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
            <LabeledField
              name="address"
              label={isFlatAddress ? t.addressFlatLabel : t.addressLineLabel}
              error={errors.address}
            >
              {(id) => (
                <input
                  id={id}
                  style={errors.address ? invalidInput() : input}
                  aria-invalid={!!errors.address}
                  placeholder={isFlatAddress ? t.addressFlatPh : t.addressLine}
                  value={addr.address}
                  onChange={(e) => set("address", e.target.value)}
                  onBlur={() => touch("address")}
                />
              )}
            </LabeledField>
            {/* Flat mode is ONE box on purpose — the merchant asked for exactly
                that. The district/area pair below is what it replaces; the zone
                it would have priced is inferred from the text instead. */}
            {isFlatAddress ? null : (
              <GeoPicker
                value={geo}
                onChange={setGeo}
                lang={lang}
                labels={{ district: t.selectDistrict, area: t.selectArea, noMatch: t.comboNoMatch }}
                fieldLabels={{ district: t.districtLabel, area: t.areaLabel }}
                errors={{ district: errors.district, area: errors.area }}
                onBlurField={touch}
              />
            )}
            {/* The question, asked only when the address genuinely places
                nothing. Two chips, not a cascade — and never a silent default,
                because a guessed zone is a wrong charge half the time. */}
            {isFlatAddress && zoned && needsZoneChoice ? (
              <LabeledField
                name="zoneChoice"
                label={t.zoneChoiceLabel}
                help={t.zoneChoiceHelp}
                error={errors.zoneChoice}
              >
                {() => (
                  <div style={{ display: "flex", gap: 9 }}>
                    {(["inside", "outside"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setZoneChoice(option);
                          touch("zoneChoice");
                        }}
                        aria-pressed={zoneChoice === option}
                        style={{
                          flex: 1,
                          padding: "11px 12px",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                          fontSize: 13.5,
                          fontWeight: zoneChoice === option ? 700 : 500,
                          color: zoneChoice === option ? "var(--text)" : "var(--muted)",
                          background:
                            zoneChoice === option ? "var(--surface)" : "transparent",
                          border: `1px solid ${
                            zoneChoice === option ? "var(--text)" : "var(--border)"
                          }`,
                        }}
                      >
                        {option === "inside" ? t.insideDhaka : t.outsideDhaka}
                      </button>
                    ))}
                  </div>
                )}
              </LabeledField>
            ) : null}
          </>
        ) : null}

        {/* The merchant's own fields sit here, after the address and before
            payment: rendered once in this block so all four checkout layouts
            get them without each re-deciding where they go. */}
        <CustomFields api={api} />

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
        {/* The derived zone + its fee, shown as a RESULT of the address above —
            never as another thing to fill in. In flat mode it also names the
            place it read, so the charge is never unexplained. */}
        {!isPickup && zoned && (isFlatAddress ? !needsZoneChoice || zoneChoice : geo.district) ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "var(--muted)" }}>
              <span>
                {t.deliveryZone} · {zoneLabel}
                {isFlatAddress && inference?.matched && !zoneChoice ? (
                  <span style={{ color: "var(--faint)" }}>
                    {" "}· {t.zoneDetected}
                  </span>
                ) : null}
              </span>
              <span className="sf-mono" style={{ color: "var(--text)", fontWeight: 700 }}>
                {shipping === 0 ? t.free : money(shipping, currency)}
              </span>
            </div>
            {deliveryEstimate ? (
              <div style={{ marginTop: 5, fontSize: 12, color: "var(--faint)" }}>
                {deliveryEstimate}
              </div>
            ) : null}
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
