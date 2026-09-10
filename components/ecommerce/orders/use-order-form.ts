"use client";
// coding-standard: maintained
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useCreateStorefrontOrder,
  useEditStorefrontOrder,
  useOrderQuote,
} from "@/services/api";
import type {
  AdminOrderChannel,
  ManualDiscountInput,
  QuoteAdminOrderInput,
} from "@/services/api/modules/storefront-orders/api";
import type { ExtractedProduct } from "@/components/sales/types";
import { useDebounce } from "@/hooks/use-debounce";
import { parseBdAddress } from "@/lib/parse-bd-address";
import { zoneForDistrict } from "@/lib/storefront-shipping";
import { isValidBdPhone } from "@/services/storefront/bd-phone";

/**
 * State, pricing and submit for the merchant's order dialog — create AND edit.
 *
 * Split out of the dialog because the component was doing three jobs at once and
 * had grown past the repo's size ceiling. The dialog now renders; this decides.
 *
 * **The one rule to keep:** no money is computed here. `line.price` is the POS
 * price (the product picker is the POS catalogue) while the order is charged
 * `storefront.onlinePrice ?? price` repriced by any live campaign — so every
 * total comes from `useOrderQuote`, which runs the server's own order-pricing
 * code. Summing lines locally is the bug this hook was built to remove.
 *
 * **Edit is the same form against a different verb**, and it is safe to share
 * precisely BECAUSE of that rule: the server re-prices the whole draft on every
 * keystroke either way, so an edit cannot drift from what it will be charged. The
 * one thing edit adds to the quote is `orderId` — without it the order is counted
 * against its own coupon limit and its agreed line prices are re-quoted at today's
 * catalogue. See docs/features/order-edit.md in the backend repo.
 */

/** One picked product. `price` is the POS price — display only, never a total. */
export interface Line {
  productId: string;
  variantId: string | null;
  label: string;
  price: number;
  quantity: number;
  availableQuantity: number;
}

/**
 * The existing order an edit seeds from.
 *
 * Built by the detail page, which pairs the order's own lines with a picker fetch
 * for their products — `availableQuantity` is not stored on an order, and without
 * it the quantity stepper has no ceiling on exactly the lines most likely to be
 * edited.
 */
export interface OrderFormInitial {
  orderId: string;
  lines: Line[];
  channel: AdminOrderChannel;
  paymentMethod: string;
  name: string;
  phone: string;
  address: string;
  district: string;
  area: string;
  notes: string;
  shippingCharged: number | null;
  coupon: string;
  discountType: "fixed" | "percentage";
  discountValue: number | null;
}

const lineKey = (l: { productId: string; variantId?: string | null }) =>
  `${l.productId}:${l.variantId ?? ""}`;

export function useOrderForm(onDone: () => void, initial?: OrderFormInitial) {
  const isEdit = !!initial;
  const createOrder = useCreateStorefrontOrder();
  const editOrder = useEditStorefrontOrder();

  const [lines, setLines] = useState<Line[]>(initial?.lines ?? []);
  const [channel, setChannel] = useState<AdminOrderChannel | "">(
    initial?.channel ?? "",
  );
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod ?? "cod");
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [area, setArea] = useState(initial?.area ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [shippingCharged, setShippingCharged] = useState<number | null>(
    initial?.shippingCharged ?? null,
  );
  // Create defaults ON — a chat order is already agreed by the conversation that
  // produced it. An edit has no such step: confirming is its own action, and an
  // edit that also reserved stock would hide that inside a "save".
  const [confirmImmediately, setConfirmImmediately] = useState(!initial);
  /**
   * Keep this order out of Meta's ad reporting (backend docs/plan/meta-pixel-capi.md D19).
   *
   * Offered at CREATION and not only on the order page, because `confirmImmediately` creates and
   * confirms in one request — for that path there is no moment afterwards in which the merchant
   * could exclude the order before it has already been queued to Meta.
   */
  const [excludeFromMeta, setExcludeFromMeta] = useState(false);
  const [pasted, setPasted] = useState("");
  const [coupon, setCoupon] = useState(initial?.coupon ?? "");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">(
    initial?.discountType ?? "fixed",
  );
  const [discountValue, setDiscountValue] = useState<number | null>(
    initial?.discountValue ?? null,
  );
  /** Merchant explicitly dropped the price hold for this session. */
  const [reprice, setReprice] = useState(false);

  /**
   * Back to the starting point — empty when creating, the ORDER when editing.
   * A cancelled edit must restore what the order says, not blank the form.
   */
  const reset = () => {
    setLines(initial?.lines ?? []);
    setChannel(initial?.channel ?? "");
    setPaymentMethod(initial?.paymentMethod ?? "cod");
    setName(initial?.name ?? "");
    setPhone(initial?.phone ?? "");
    setAddress(initial?.address ?? "");
    setDistrict(initial?.district ?? "");
    setArea(initial?.area ?? "");
    setNotes(initial?.notes ?? "");
    setShippingCharged(initial?.shippingCharged ?? null);
    setConfirmImmediately(!initial);
    setPasted("");
    setCoupon(initial?.coupon ?? "");
    setDiscountType(initial?.discountType ?? "fixed");
    setDiscountValue(initial?.discountValue ?? null);
    setReprice(false);
  };

  /**
   * Prefill the address fields from the blob the buyer sent in chat.
   *
   * **Only fills what it is sure of, and only over an empty field.** A merchant
   * who has already corrected something must not have it overwritten by a second
   * paste — the parser is a typing shortcut, not an authority. Anything it could
   * not identify (most often the district) is simply left for them to pick.
   */
  const applyPaste = () => {
    const parsed = parseBdAddress(pasted);
    const filled: string[] = [];
    const fill = (
      value: string | undefined,
      current: string,
      set: (v: string) => void,
      label: string,
    ) => {
      if (!value || current.trim()) return;
      set(value);
      filled.push(label);
    };

    fill(parsed.name, name, setName, "name");
    fill(parsed.phone, phone, setPhone, "phone");
    fill(parsed.address, address, setAddress, "address");
    if (parsed.district && !district) {
      setDistrict(parsed.district);
      filled.push("district");
      // The area list is district-scoped, so it can only be set alongside the
      // district it came from.
      if (parsed.area) {
        setArea(parsed.area);
        filled.push("area");
      }
    }

    if (!filled.length) {
      toast.info("Nothing new to fill in — check the pasted text");
      return;
    }
    // Name what was filled AND what was not: a silent partial parse is how a
    // merchant ends up submitting an order with no district.
    const missing = ["name", "phone", "district"].filter(
      (f) =>
        !filled.includes(f) &&
        !{ name, phone, district }[f as "name" | "phone" | "district"].trim(),
    );
    toast.success(
      missing.length
        ? `Filled ${filled.join(", ")} — still needed: ${missing.join(", ")}`
        : `Filled ${filled.join(", ")}`,
    );
  };

  const addLine = (product: ExtractedProduct) => {
    setLines((prev) => {
      // Same product picked twice is one line with more quantity, not two lines
      // — the server merges them anyway when it checks stock.
      const incoming = lineKey(product);
      if (prev.some((l) => lineKey(l) === incoming)) {
        return prev.map((l) =>
          lineKey(l) === incoming ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          productId: product.productId,
          variantId: product.variantId,
          label: product.label,
          price: product.price,
          quantity: 1,
          availableQuantity: product.availableQuantity,
        },
      ];
    });
  };

  const setQuantity = (line: Line, quantity: number) =>
    setLines((prev) =>
      prev.map((row) => (row === line ? { ...row, quantity } : row)),
    );

  const removeLine = (line: Line) =>
    setLines((prev) => prev.filter((row) => row !== line));

  const manualDiscount: ManualDiscountInput | undefined = useMemo(
    () =>
      discountValue && discountValue > 0
        ? { type: discountType, value: discountValue }
        : undefined,
    [discountType, discountValue],
  );

  /** The draft, as the server needs it to price the order. */
  const draft: QuoteAdminOrderInput | null = useMemo(
    () =>
      lines.length
        ? {
            items: lines.map((l) => ({
              productId: l.productId,
              variantId: l.variantId ?? undefined,
              quantity: l.quantity,
            })),
            // The phone carries the coupon's per-buyer limit and the zone prices
            // delivery — send both, or the quote is not the charge.
            shippingAddress: {
              phone: phone.trim() || undefined,
              zone: district ? zoneForDistrict(district) : undefined,
            },
            couponCode: coupon.trim() || undefined,
            discount: manualDiscount,
            shippingCharged: shippingCharged ?? undefined,
            // Edit only, and required on EVERY quote: it stops the order counting
            // against its own coupon limit and holds the prices already agreed.
            orderId: initial?.orderId,
            reprice: reprice || undefined,
          }
        : null,
    [
      lines,
      phone,
      district,
      coupon,
      manualDiscount,
      shippingCharged,
      initial?.orderId,
      reprice,
    ],
  );

  // Debounced so typing a coupon or a discount is one request, not one per key.
  const { data: quote, isFetching: quoting } = useOrderQuote(
    useDebounce(draft, 400),
  );

  // Lines the order path would refuse — reported by the quote rather than thrown,
  // so the merchant fixes the row instead of losing everything they typed.
  const rejected = useMemo(() => quote?.rejected ?? [], [quote]);
  const sameLine = (a: { productId: string; variantId?: string }, l: Line) =>
    a.productId === l.productId && (a.variantId ?? null) === l.variantId;

  const submit = () => {
    if (!canSubmit) return;

    /** Everything both verbs send. Built once so they cannot disagree. */
    const shared = {
      items: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId ?? undefined,
        quantity: l.quantity,
      })),
      shippingAddress: {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        district: district || undefined,
        area: area || undefined,
        // Same zone the quote above was priced with. The server derives it from
        // the district when it is absent, so this is belt and braces — but a save
        // that carries less than the quote is exactly how the two came to
        // disagree, and an edit that omitted it also erased the order's zone.
        zone: district ? zoneForDistrict(district) : undefined,
      },
      paymentMethod: paymentMethod as "cod" | "bank" | "manual",
      notes: notes.trim() || undefined,
      // Sent only if it actually applied — a code the quote rejected must not
      // reach the order, where the same rejection would be a 400 instead.
      couponCode: quote?.couponCode,
      // Type + value, never the resolved amount: the server applies a
      // percentage to its own subtotal, which is the one being charged.
      discount: manualDiscount,
      // Only send an override when the merchant actually typed one — otherwise
      // the store's own shipping rule prices the order, same as a web order.
      shippingCharged: shippingCharged ?? undefined,
    };

    if (initial) {
      editOrder.mutate(
        { id: initial.orderId, body: { ...shared, reprice: reprice || undefined } },
        // No `reset()`: the dialog closes and the detail page re-renders from the
        // response, so resetting would only flash the pre-edit values.
        { onSuccess: onDone },
      );
      return;
    }

    if (!channel) return;
    createOrder.mutate(
      { ...shared, channel, confirmImmediately, excludeFromMeta },
      {
        onSuccess: (res) => {
          // The server confirms best-effort: a stock shortfall leaves the order
          // pending rather than losing it, so say which actually happened rather
          // than claiming stock is held when it may not be.
          if (confirmImmediately && res.data?.status === "pending") {
            toast.warning(
              "Order created, but stock could not be reserved — confirm it manually",
            );
          }
          reset();
          onDone();
        },
      },
    );
  };

  const phoneInvalid = !!phone.trim() && !isValidBdPhone(phone);
  const canSubmit =
    lines.length > 0 &&
    // Edit locks `channel` (it is provenance, not a preference), so it is already
    // set and there is nothing for the merchant to answer.
    (isEdit || !!channel) &&
    !!name.trim() &&
    isValidBdPhone(phone) &&
    rejected.length === 0;

  return {
    isEdit,
    // lines
    lines,
    addLine,
    setQuantity,
    removeLine,
    // fields
    channel,
    setChannel,
    paymentMethod,
    setPaymentMethod,
    name,
    setName,
    phone,
    setPhone,
    address,
    setAddress,
    district,
    setDistrict,
    area,
    setArea,
    notes,
    setNotes,
    shippingCharged,
    setShippingCharged,
    confirmImmediately,
    excludeFromMeta,
    setExcludeFromMeta,
    setConfirmImmediately,
    pasted,
    setPasted,
    applyPaste,
    coupon,
    setCoupon,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    reprice,
    setReprice,
    // server-quoted money
    quote,
    quoting,
    rejected,
    quotedFor: (l: Line) => quote?.items.find((i) => sameLine(i, l)),
    rejectedFor: (l: Line) => rejected.find((r) => sameLine(r, l)),
    // submit
    phoneInvalid,
    canSubmit,
    submitting: createOrder.isPending || editOrder.isPending,
    submit,
    reset,
  };
}
