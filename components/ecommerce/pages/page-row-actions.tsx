"use client";
// coding-standard: maintained

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BarChart3,
  Copy,
  Eye,
  HousePlus,
  Link2,
  MoreHorizontal,
  PencilRuler,
  Tag,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  useDeleteStorefrontPage,
  useDuplicateStorefrontPage,
  useSetStorefrontHomePage,
  type StorefrontPageListItem,
} from "@/services/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { copyText } from "@/utils/clipboard";
import { Button } from "@/ui/components/button";
import { EasyAlertDialog } from "@/ui/components/custom/easy-alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/ui/components/sheet";
import { cn } from "@/ui/lib/utils";
import { HomepageDialog } from "./homepage-dialog";

interface PageAction {
  key: string;
  label: string;
  icon: ReactNode;
  href?: string;
  /** Opens in a new tab — the live page, never an admin screen. */
  external?: boolean;
  onSelect?: () => void;
  destructive?: boolean;
  /** A count shown at the row's end (orders). */
  count?: number;
  /** Starts a new block in the list. */
  separated?: boolean;
}

const ICON = "h-4 w-4 shrink-0";

/**
 * Everything a merchant can do to one page, behind the row's ⋯ button.
 *
 * **A bottom sheet on a phone, a menu on desktop** — the same list either way. A
 * dropdown anchored to a 44px button on a phone opens as a narrow card under
 * the thumb; a sheet gives every action a full-width row.
 *
 * Which actions a page offers follows what the backend allows for its kind: a
 * store page is never duplicated or made the homepage, and a campaign page is
 * deleted with its campaign, never from here.
 */
export function PageRowActions({
  page,
  address,
  liveUrl,
}: {
  page: StorefrontPageListItem;
  /** The page's path on the shop (`/pages/about-us`), when it has one of its own. */
  address: string | null;
  /** The page's full URL, when shoppers can open it. */
  liveUrl: string | null;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [homepageFor, setHomepageFor] = useState<StorefrontPageListItem | null>(null);
  const duplicate = useDuplicateStorefrontPage();
  const setHome = useSetStorefrontHomePage();
  const remove = useDeleteStorefrontPage();

  const copyLink = async () => {
    if (!liveUrl) return;
    try {
      await copyText(liveUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const landing = page.kind === "landing";
  const homeAction: PageAction | null = page.isHome
    ? { key: "stop-home", label: "Stop using as homepage", icon: <Undo2 className={ICON} />, onSelect: () => setHome.mutate(null) }
    : page.status === "published"
      ? { key: "home", label: "Use as homepage", icon: <HousePlus className={ICON} />, onSelect: () => setHomepageFor(page) }
      : null;
  const actions: PageAction[] = [
    { key: "edit", label: "Edit page", icon: <PencilRuler className={ICON} />, href: `/ecommerce/pages/${page._id}` },
    ...(liveUrl
      ? [
          { key: "view", label: "View live page", icon: <Eye className={ICON} />, href: liveUrl, external: true },
          { key: "copy", label: landing ? "Copy link for ads" : "Copy link", icon: <Link2 className={ICON} />, onSelect: copyLink },
        ]
      : []),
    ...(landing && page.orders > 0
      ? [{ key: "orders", label: "See its orders", icon: <BarChart3 className={ICON} />, href: `/ecommerce/orders?pageId=${page._id}`, count: page.orders }]
      : []),
    ...(page.kind === "campaign"
      ? [{ key: "campaigns", label: "Open campaigns", icon: <Tag className={ICON} />, href: "/ecommerce/campaigns" }]
      : []),
    ...(landing
      ? [
          { key: "duplicate", label: "Duplicate", icon: <Copy className={ICON} />, onSelect: () => duplicate.mutate(page._id), separated: true },
          ...(homeAction ? [homeAction] : []),
        ]
      : []),
    ...(page.kind !== "campaign"
      ? [{ key: "delete", label: "Delete page", icon: <Trash2 className={ICON} />, onSelect: () => setConfirmingDelete(true), destructive: true, separated: true }]
      : []),
  ];

  const trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="h-11 w-11 shrink-0 text-muted-foreground md:h-9 md:w-9"
      aria-label={`More actions for ${page.title}`}
    >
      <MoreHorizontal className="h-5 w-5" />
    </Button>
  );

  const label = (action: PageAction) => (
    <>
      {action.icon}
      <span className="flex-1">{action.label}</span>
      {action.count ? (
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
          {action.count}
        </span>
      ) : null}
    </>
  );

  return (
    <>
      {isMobile ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>{trigger}</SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
            <SheetHeader className="text-left">
              <SheetTitle className="truncate">{page.title}</SheetTitle>
              <SheetDescription className="font-mono text-xs">
                {address ?? "Page actions"}
              </SheetDescription>
            </SheetHeader>
            <nav aria-label="Page actions" className="flex flex-col px-2">
              {actions.map((action) => {
                const className = cn(
                  "flex min-h-[52px] w-full items-center gap-3.5 rounded-lg px-3 text-left text-base font-medium hover:bg-muted",
                  action.destructive && "text-destructive",
                  action.separated && "mt-1.5 border-t pt-1.5",
                );
                return action.href ? (
                  <Link
                    key={action.key}
                    href={action.href}
                    target={action.external ? "_blank" : undefined}
                    rel={action.external ? "noopener noreferrer" : undefined}
                    className={className}
                    onClick={() => setOpen(false)}
                  >
                    {label(action)}
                  </Link>
                ) : (
                  <button
                    key={action.key}
                    type="button"
                    className={className}
                    onClick={() => {
                      setOpen(false);
                      action.onSelect?.();
                    }}
                  >
                    {label(action)}
                  </button>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {actions.map((action) => (
              <div key={action.key}>
                {action.separated ? <DropdownMenuSeparator /> : null}
                {action.href ? (
                  <DropdownMenuItem asChild className={cn(action.destructive && "text-destructive")}>
                    <Link
                      href={action.href}
                      target={action.external ? "_blank" : undefined}
                      rel={action.external ? "noopener noreferrer" : undefined}
                    >
                      {label(action)}
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    className={cn(action.destructive && "text-destructive focus:text-destructive")}
                    onSelect={() => action.onSelect?.()}
                  >
                    {label(action)}
                  </DropdownMenuItem>
                )}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <EasyAlertDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        title={`Delete "${page.title}"?`}
        description="Shoppers who open its address will see a not-found page. This cannot be undone."
        confirmLabel="Delete page"
        isConfirming={remove.isPending}
        onConfirm={() => remove.mutate(page._id)}
      />
      <HomepageDialog page={homepageFor} onClose={() => setHomepageFor(null)} />
    </>
  );
}
