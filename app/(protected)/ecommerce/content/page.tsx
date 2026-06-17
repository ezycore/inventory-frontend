"use client";

import { useState } from "react";
import {
  useContentPages,
  useCreateContentPage,
  useDeleteContentPage,
  useUpdateContentPage,
  type ContentPage,
} from "@/services/api";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";

export default function ContentPage() {
  const { data: pages, isLoading } = useContentPages();
  const remove = useDeleteContentPage();
  const [editing, setEditing] = useState<ContentPage | null>(null);
  const [showForm, setShowForm] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (p: ContentPage) => {
    setEditing(p);
    setShowForm(true);
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Content</h1>
          <p className="text-sm text-muted-foreground">
            Storefront pages (About, FAQ, policies). Published pages can appear in
            the footer.
          </p>
        </div>
        <Button onClick={openCreate}>New page</Button>
      </div>

      {showForm && (
        <ContentPageForm
          key={editing?._id ?? "new"}
          editing={editing}
          onDone={() => setShowForm(false)}
        />
      )}

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Published</th>
              <th className="p-3 font-medium">Footer</th>
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
            ) : !pages || pages.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                  No pages yet.
                </td>
              </tr>
            ) : (
              pages.map((p) => (
                <tr key={p._id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3 font-mono text-muted-foreground">/{p.slug}</td>
                  <td className="p-3">{p.published ? "Yes" : "Draft"}</td>
                  <td className="p-3 text-muted-foreground">
                    {p.published && p.showInFooter ? "Yes" : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => openEdit(p)}
                      className="mr-3 text-sm hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => remove.mutate(p._id)}
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

function ContentPageForm({
  editing,
  onDone,
}: {
  editing: ContentPage | null;
  onDone: () => void;
}) {
  const create = useCreateContentPage();
  const update = useUpdateContentPage();
  const [f, setF] = useState({
    title: editing?.title ?? "",
    slug: editing?.slug ?? "",
    body: editing?.body ?? "",
    published: editing?.published ?? false,
    showInFooter: editing?.showInFooter ?? true,
    sortOrder: String(editing?.sortOrder ?? 0),
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) =>
    setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const body = {
      title: f.title.trim(),
      slug: f.slug.trim(),
      body: f.body,
      published: f.published,
      showInFooter: f.showInFooter,
      sortOrder: Number(f.sortOrder) || 0,
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
        <CardTitle>{editing ? `Edit ${editing.title}` : "New page"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Title">
            <input
              value={f.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full rounded-md border px-2 py-1 text-sm"
            />
          </Field>
          <Field label="Slug (URL)">
            <input
              value={f.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="about"
              className="w-full rounded-md border px-2 py-1 text-sm"
            />
          </Field>
        </div>
        <Field label="Body (Markdown / plain text)">
          <textarea
            value={f.body}
            onChange={(e) => set("body", e.target.value)}
            rows={10}
            className="w-full rounded-md border px-2 py-1 font-mono text-sm"
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.published}
              onChange={(e) => set("published", e.target.checked)}
            />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.showInFooter}
              onChange={(e) => set("showInFooter", e.target.checked)}
            />
            Show in footer
          </label>
          <Field label="Footer order">
            <input
              type="number"
              value={f.sortOrder}
              onChange={(e) => set("sortOrder", e.target.value)}
              className="w-full rounded-md border px-2 py-1 text-sm"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={
              create.isPending ||
              update.isPending ||
              !f.title.trim() ||
              !f.slug.trim()
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
