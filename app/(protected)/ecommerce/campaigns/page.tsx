"use client";

import { useState } from "react";
import {
  useCampaigns,
  useCreateCampaign,
  useDeleteCampaign,
  useUpdateCampaign,
  type Campaign,
} from "@/services/api";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";

const dateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");

export default function CampaignsPage() {
  const { data: campaigns, isLoading } = useCampaigns();
  const remove = useDeleteCampaign();
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="container mx-auto max-w-4xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          New campaign
        </Button>
      </div>

      {showForm && (
        <CampaignForm
          key={editing?._id ?? "new"}
          editing={editing}
          onDone={() => setShowForm(false)}
        />
      )}

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Scope</th>
              <th className="p-3 font-medium">Discount</th>
              <th className="p-3 font-medium">Window</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : !campaigns || campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  No campaigns yet.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c._id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 capitalize text-muted-foreground">
                    {c.scope}
                  </td>
                  <td className="p-3">
                    {c.type === "percentage" ? `${c.value}%` : c.value}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {dateInput(c.startsAt)} → {dateInput(c.endsAt)}
                  </td>
                  <td className="p-3 capitalize">{c.status}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setShowForm(true);
                      }}
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

function CampaignForm({
  editing,
  onDone,
}: {
  editing: Campaign | null;
  onDone: () => void;
}) {
  const create = useCreateCampaign();
  const update = useUpdateCampaign();
  const [f, setF] = useState({
    name: editing?.name ?? "",
    scope: editing?.scope ?? "storewide",
    type: editing?.type ?? "percentage",
    value: String(editing?.value ?? ""),
    startsAt: dateInput(editing?.startsAt),
    endsAt: dateInput(editing?.endsAt),
    targets: (editing?.targets ?? []).join(", "),
    status: editing?.status ?? "active",
  });
  const set = (k: keyof typeof f, v: string) =>
    setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const body = {
      name: f.name.trim(),
      scope: f.scope as "storewide" | "category" | "product",
      type: f.type as "percentage" | "fixed",
      value: Number(f.value) || 0,
      startsAt: f.startsAt,
      endsAt: f.endsAt,
      targets:
        f.scope === "storewide"
          ? []
          : f.targets
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
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
        <CardTitle>{editing ? `Edit ${editing.name}` : "New campaign"}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Scope">
          <select
            value={f.scope}
            onChange={(e) => set("scope", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          >
            <option value="storewide">Storewide</option>
            <option value="category">Category</option>
            <option value="product">Product</option>
          </select>
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
        <Field label="Starts">
          <input
            type="date"
            value={f.startsAt}
            onChange={(e) => set("startsAt", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
        </Field>
        <Field label="Ends">
          <input
            type="date"
            value={f.endsAt}
            onChange={(e) => set("endsAt", e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
        </Field>
        {f.scope !== "storewide" && (
          <Field
            label={`${f.scope === "category" ? "Category" : "Product"} IDs (comma-separated)`}
          >
            <input
              value={f.targets}
              onChange={(e) => set("targets", e.target.value)}
              placeholder="id1, id2"
              className="w-full rounded-md border px-2 py-1 text-sm"
            />
          </Field>
        )}
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
            disabled={
              create.isPending ||
              update.isPending ||
              !f.name.trim() ||
              !f.startsAt ||
              !f.endsAt
            }
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
