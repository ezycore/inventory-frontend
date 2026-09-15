"use client";
// coding-standard: maintained

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCreateStorefrontPage } from "@/services/api";
import { Button } from "@/ui/components/button";
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

/** The backend's title limit (`createStorefrontPageSchema`). */
const TITLE_MAX = 160;

/**
 * "New landing page" asks for a name and nothing else. The backend picks a free
 * address from it, hides the page from search engines and gives it the minimal
 * header; everything else happens in the editor, which is where the merchant
 * lands — an empty page is not something to configure in a form.
 */
export function NewPageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const create = useCreateStorefrontPage();
  const [title, setTitle] = useState("");
  const name = title.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name || create.isPending) return;
    create.mutate(
      { title: name },
      {
        onSuccess: (res) => {
          if (!res.data) return;
          setTitle("");
          onOpenChange(false);
          router.push(`/ecommerce/pages/${res.data._id}`);
        },
      },
    );
  };

  return (
    // Closing is held while the request is out, so the merchant is not left
    // wondering whether a page was made.
    <Dialog open={open} onOpenChange={(next) => !create.isPending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>New landing page</DialogTitle>
            <DialogDescription>
              Name it for yourself. You can change the name, its address and everything on it in
              the editor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-page-title">Page name</Label>
            <Input
              id="new-page-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={TITLE_MAX}
              placeholder="Eid offer"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name || create.isPending}>
              {create.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create and open editor
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
