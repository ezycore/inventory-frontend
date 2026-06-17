"use client";

import { useState } from "react";
import {
  useCoupons,
  useCreateCoupon,
  useDeleteCoupon,
  useUpdateCoupon,
  type Coupon,
} from "@/services/api";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";

const num = (v: string): number | undefined =>
  v.trim() === "" ? undefined : Number(v);
const dateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");

export default function CouponsPage() {
  const { data: coupons, isLoading } = useCoupons();
  const remove = useDeleteCoupon();
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [showForm, setShowForm] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setShowForm(true);
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Coupons</h1>
        <Button onClick={openCreate}>New coupon</Button>
      </div>

      {showForm && (
        <CouponForm
          key={editing?._id ?? "new"}
          editing={editing}
          onDone={() => setShowForm(false)}
        />
      )}

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Code</th>
              <th className="p-3 font-medium">Discount</th>
              <th className="p-3 font-medium">Used</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : !coupons || coupons.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                  No coupons yet.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c._id} className="border-b last:border-0">
                  <td className="p-3 font-mono font-medium">{c.code}</td>
                  <td className="p-3">
                    {c.type === "percentage" ? `${c.value}%` : c.value}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {c.usedCount}
                    {c.maxUses ? ` / ${c.maxUses}` : ""}
                  </td>
                  <td className="p-3 capitalize">{c.status}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => openEdit(c)}
                      className="mr-3 text-sm hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove.mutate(c._id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CouponForm({
  editing,
  onDone,
}: {
  editing: Coupon | null;
  onDone: () => void;
}) {
  const create = useCreateCoupon();
  const update = useUpdateCoupon();
  const [f, setF] = useState({
    code: editing?.code ?? "",
    type: editing?.type ?? "percentage",
    value: String(editing?.value ?? ""),
    validFrom: dateInput(editing?.validFrom),
    validUntil: dateInput(editing?.validUntil),
    minOrderValue: String(editing?.minOrderValue ?? ""),
    maxUses: String(editing?.maxUses ?? ""),
    perShopperLimit: String(editing?.perShopperLimit ?? ""),
    maxDiscountAmount: String(editing?.maxDiscountAmount ?? ""),
    status: editing?.status ?? "active",
  });
  const set = (k: keyof typeof f, v: string) =>
    setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const body = {
      code: f.code.trim(),
      type: f.type as "percentage" | "fixed",
      value: Number(f.value) || 0,
      validFrom: f.validFrom || undefined,
      validUntil: f.validUntil || undefined,
      minOrderValue: num(f.minOrderValue),
      maxUses: num(f.maxUses),
      perShopperLimit: num(f.perShopperLimit),
      maxDiscountAmount: num(f.maxDiscountAmount),
      status: f.status as "active" | "inactive",
    };
    if (editing) {
      update.mutate({ id: editing._id, body }, { onSuccess: onDone });
    } else {
      create.mutate(body, { onSuccess: onDone });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? `Edit ${editing.code}` : "New coupon"}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Code">
          <input
            value={f.code}
            onChange={(e) => set("code", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm uppercase"
          />
        </Field>
        <Field label="Type">
          <select
            value={f.type}
            onChange={(e) => set("type", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </Field>
        <Field label="Value">
          <input
            type="number"
            value={f.value}
            onChange={(e) => set("value", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Max discount (cap, optional)">
          <input
            type="number"
            value={f.maxDiscountAmount}
            onChange={(e) => set("maxDiscountAmount", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Valid from">
          <input
            type="date"
            value={f.validFrom}
            onChange={(e) => set("validFrom", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Valid until">
          <input
            type="date"
            value={f.validUntil}
            onChange={(e) => set("validUntil", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Min order value">
          <input
            type="number"
            value={f.minOrderValue}
            onChange={(e) => set("minOrderValue", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Max total uses">
          <input
            type="number"
            value={f.maxUses}
            onChange={(e) => set("maxUses", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Per-shopper limit">
          <input
            type="number"
            value={f.perShopperLimit}
            onChange={(e) => set("perShopperLimit", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Status">
          <select
            value={f.status}
            onChange={(e) => set("status", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>

        <div className="col-span-full flex justify-end gap-2">
          <Button variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={create.isPending || update.isPending || !f.code.trim()}
          >
            {editing ? "Save" : "Create"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
