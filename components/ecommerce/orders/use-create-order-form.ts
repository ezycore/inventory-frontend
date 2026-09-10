"use client";
// coding-standard: maintained
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCreateStorefrontOrder, useOrderQuote } from "@/services/api";
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
 * State, pricing and submit for the merchant's create-order dialog.
 *
 * Split out of the dialog because the component was doing three jobs at once and
 * had grown past the repo's size ceiling. The dialog now renders; this decides.
 *
 * **The one rule to keep:** no money is computed here. `line.price` is the POS
 * price (the product picker is the POS catalogue) while the order is charged
 * `storefront.onlinePrice ?? price` repriced by any live campaign — so every
 * total comes from `useOrderQuote`, which runs the server's own order-pricing
 * code. Summing lines locally is the bug this hook was built to remove.
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

const lineKey = (l: { productId: string; variantId?: string | null }) =>
  `${l.productId}:${l.variantId ?? ""}`;

export function useCreateOrderForm(onDone: () => void) {
  const createOrder = useCreateStorefrontOrder();

  const [lines, setLines] = useState<Line[]>([]);
  const [channel, setChannel] = useState<AdminOrderChannel | "">("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingCharged, setShippingCharged] = useState<number | null>(null);
  const [confirmImmediately, setConfirmImmediately] = useState(true);
  const [pasted, setPasted] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [discountValue, setDiscountValue] = useState<number | null>(null);

  const reset = () => {
    setLines([]);
    setChannel("");
    setPaymentMethod("cod");
    setName("");
    setPhone("");
    setAddress("");
    setDistrict("");
    setArea("");
    setNotes("");
    setShippingCharged(null);
    setConfirmImmediately(true);
    setPasted("");
    setCoupon("");
    setDiscountType("fixed");
    setDiscountValue(null);
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
          }
        : null,
    [lines, phone, district, coupon, manualDiscount, shippingCharged],
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
    if (!canSubmit || !channel) return;
    createOrder.mutate(
      {
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
          // The zone the quote was priced with — send the same thing to the save,
          // or the two are being asked different questions.
          zone: district ? zoneForDistrict(district) : undefined,
        },
        paymentMethod: paymentMethod as "cod" | "bank" | "manual",
        channel,
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
        confirmImmediately,
      },
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
    !!channel &&
    !!name.trim() &&
    isValidBdPhone(phone) &&
    rejected.length === 0;

  return {
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
    // server-quoted money
    quote,
    quoting,
    rejected,
    quotedFor: (l: Line) => quote?.items.find((i) => sameLine(i, l)),
    rejectedFor: (l: Line) => rejected.find((r) => sameLine(r, l)),
    // submit
    phoneInvalid,
    canSubmit,
    submitting: createOrder.isPending,
    submit,
    reset,
  };
}
