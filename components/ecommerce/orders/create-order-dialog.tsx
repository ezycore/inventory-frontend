"use client";
// coding-standard: maintained
import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateStorefrontOrder } from "@/services/api";
import type { AdminOrderChannel } from "@/services/api/modules/storefront-orders/api";
import { ProductSearch } from "@/components/sales/product-search";
import type { ExtractedProduct } from "@/components/sales/types";
import { BD_DISTRICTS, districtLabel, upazilasOf } from "@/lib/bd-geo";
import { formatCurrency } from "@/lib/currency";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { isValidBdPhone } from "@/services/storefront/bd-phone";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { NumberField } from "@/ui/components/number-field";
import { SimpleSelect } from "@/ui/components/simple-select";
import { SimpleTable } from "@/ui/components/simple-table";
import { Textarea } from "@/ui/components/textarea";

/**
 * Record an order the merchant took off the website.
 *
 * This is the screen the whole omnichannel feature exists for: most of a BD
 * f-commerce merchant's volume arrives by Messenger, WhatsApp, a boosted post's
 * comments or a phone call, and until now their only way to ring it up was a POS
 * `Sale` — which has no courier dispatch, no tracking, no COD advance, no RTO and
 * no fraud check. Typing it here puts it on the same pipeline as a web order.
 *
 * **Channel is required and has no default.** Guessing it would file every chat
 * order as `website` and quietly make the channel report — the number that tells
 * the merchant whether Messenger orders are worth their courier fees — a lie.
 */

const CHANNELS: { value: AdminOrderChannel; label: string }[] = [
  { value: "messenger", label: "Messenger" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "comment", label: "Post comment" },
  { value: "phone", label: "Phone call" },
  { value: "manual", label: "Other" },
];

const PAYMENT_METHODS = [
  { value: "cod", label: "Cash on delivery" },
  { value: "bank", label: "Bank transfer" },
  // Merchant-only: the model has always allowed it, the shopper schema never did.
  { value: "manual", label: "Already paid / manual" },
];

interface Line {
  productId: string;
  variantId: string | null;
  label: string;
  price: number;
  quantity: number;
  availableQuantity: number;
}

export function CreateOrderDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const currency = useAuthStore((s) => s.user?.organization?.currency);
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
  };

  const addLine = (product: ExtractedProduct) => {
    setLines((prev) => {
      // Same product picked twice is one line with more quantity, not two lines
      // — the server merges them anyway when it checks stock.
      const key = (l: Line) =>
        `${l.productId}:${l.variantId ?? ""}`;
      const incoming = `${product.productId}:${product.variantId ?? ""}`;
      const existing = prev.find((l) => key(l) === incoming);
      if (existing) {
        return prev.map((l) =>
          key(l) === incoming ? { ...l, quantity: l.quantity + 1 } : l,
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

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines],
  );

  const areas = useMemo(() => upazilasOf(district), [district]);
  const phoneInvalid = !!phone.trim() && !isValidBdPhone(phone);
  const canSubmit =
    lines.length > 0 && !!channel && !!name.trim() && isValidBdPhone(phone);

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
        },
        paymentMethod: paymentMethod as "cod" | "bank" | "manual",
        channel,
        notes: notes.trim() || undefined,
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
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create order</DialogTitle>
          <DialogDescription>
            For an order taken on Messenger, WhatsApp, a post comment or the phone.
            It runs the same pipeline as a website order — courier, tracking and
            COD included.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Products</Label>
            <ProductSearch onSelect={addLine} placeholder="Search products…" />
            {lines.length > 0 ? (
              <SimpleTable
                columns={[
                  { key: "item", header: "Item", cell: (l: Line) => l.label },
                  {
                    key: "qty",
                    header: "Qty",
                    align: "right",
                    cell: (l: Line) => (
                      <NumberField
                        value={l.quantity}
                        precision={0}
                        min={1}
                        max={l.availableQuantity}
                        onChange={(v) =>
                          setLines((prev) =>
                            prev.map((row) =>
                              row === l ? { ...row, quantity: v ?? 1 } : row,
                            ),
                          )
                        }
                        className="w-20"
                      />
                    ),
                  },
                  {
                    key: "total",
                    header: "Total",
                    align: "right",
                    cell: (l: Line) =>
                      formatCurrency(l.price * l.quantity, currency),
                  },
                  {
                    key: "remove",
                    header: "",
                    align: "right",
                    cell: (l: Line) => (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setLines((prev) => prev.filter((row) => row !== l))
                        }
                        aria-label={`Remove ${l.label}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ),
                  },
                ]}
                rows={lines}
                getRowKey={(l: Line) => `${l.productId}:${l.variantId ?? ""}`}
              />
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Where did this order come from?</Label>
              <SimpleSelect
                value={channel}
                onValueChange={(v) => setChannel(v as AdminOrderChannel)}
                options={CHANNELS}
                placeholder="Select a channel"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment</Label>
              <SimpleSelect
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                options={PAYMENT_METHODS}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Customer name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={phone}
                inputMode="tel"
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={phoneInvalid}
              />
              {/* The phone is the buyer's identity on an order with no account —
                  it keys the customer match, the delivery-risk score and the
                  coupon limit — so the server rejects one it cannot normalise. */}
              {phoneInvalid ? (
                <p className="text-xs text-destructive">
                  Enter a valid Bangladeshi mobile number, e.g. 01712345678
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>District</Label>
              <SimpleSelect
                value={district}
                onValueChange={(v) => {
                  setDistrict(v);
                  // The area list is district-scoped, so a stale area would be
                  // sent for the wrong district and break courier resolution.
                  setArea("");
                }}
                options={BD_DISTRICTS.map((d) => ({
                  value: d.name,
                  label: districtLabel(d, "en"),
                }))}
                placeholder="Select a district"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Area</Label>
              <SimpleSelect
                value={area}
                onValueChange={setArea}
                options={areas.map((a) => ({ value: a.name, label: a.name }))}
                placeholder={district ? "Select an area" : "Pick a district first"}
                disabled={!district}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Delivery charge</Label>
              <NumberField
                value={shippingCharged}
                precision={2}
                min={0}
                onChange={setShippingCharged}
                placeholder="Use store rule"
              />
              {/* Blank = price it like a web order. A typed 0 is a real answer
                  ("free delivery, we agreed") and the server honours it. */}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                rows={2}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={confirmImmediately}
              onCheckedChange={(c) => setConfirmImmediately(c === true)}
            />
            <span>
              Confirm and reserve stock now
              <span className="block text-xs text-muted-foreground">
                A chat order is already agreed, so this saves a second click.
              </span>
            </span>
          </label>

          {lines.length > 0 ? (
            <div className="flex justify-between border-t pt-3 text-sm font-semibold">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={!canSubmit || createOrder.isPending}
          >
            {createOrder.isPending ? "Creating…" : "Create order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
