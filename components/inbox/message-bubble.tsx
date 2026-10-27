"use client";
// coding-standard: maintained

import { useFormatters } from "@/hooks/use-formatters";
import type { InboxMessage } from "@/services/api";
import { cn } from "@/ui/lib/utils";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { FlagReply } from "./flag-reply";
import { attachmentKind } from "./inbox-utils";

/**
 * One message. The customer's sit left, the shop's right. A reply typed in Meta's own inbox
 * (`source: "platform_inbox"`) says so, and so does one the AI wrote (`role: "ai"`) — staff
 * otherwise cannot tell either from one they sent here. Someone who may reply may also flag an AI
 * reply as wrong (`canFlag`). Product cards the AI sent show as the customer saw them.
 */
export function MessageBubble({
  message,
  conversationId,
  canFlag = false,
}: {
  message: InboxMessage;
  conversationId?: string;
  canFlag?: boolean;
}) {
  const t = useTranslations("inbox.thread");
  const { formatDateTime } = useFormatters();
  const fromShop = message.role !== "customer";

  if (message.role === "system" && message.orderId) return <OrderNote message={message} />;
  const cards = message.attachments.filter((attachment) => attachment.type === "product");
  const others = message.attachments.filter((attachment) => attachment.type !== "product");

  return (
    <div className={cn("flex", fromShop ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] space-y-1 rounded-2xl px-3 py-2 text-sm",
          fromShop ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted",
        )}
      >
        {others.map((attachment, index) => (
          <Attachment key={index} type={attachment.type} url={attachment.url} />
        ))}
        {cards.length > 0 && <ProductCards cards={cards} />}
        {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
        <div className="flex flex-wrap items-center justify-between gap-x-3">
          <p className={cn("text-[11px]", fromShop ? "text-primary-foreground/75" : "text-muted-foreground")}>
            {formatDateTime(message.at)}
            {message.source === "platform_inbox" && ` · ${t("fromFacebook")}`}
            {message.role === "ai" && ` · ${t("fromAi")}`}
          </p>
          {message.role === "ai" && canFlag && conversationId && message._id && (
            <FlagReply conversationId={conversationId} message={message} />
          )}
          {/* Read-only viewers still see that someone flagged it. */}
          {message.role === "ai" && !canFlag && message.aiFlag && (
            <p className="text-[11px] font-medium text-amber-200">
              {t("flag.flagged", { reason: t(`flag.reason.${message.aiFlag.reason}`) })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A note for staff, never sent to the customer: the AI took an order here (plan §12 Phase 2).
 * Centred like a date divider, so nobody reads it as something the customer saw.
 */
function OrderNote({ message }: { message: InboxMessage }) {
  const t = useTranslations("inbox.thread");
  const { formatDateTime } = useFormatters();
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
        <ShoppingBag className="h-3.5 w-3.5" />
        <span>
          {t("orderPlaced")} · {formatDateTime(message.at)}
        </span>
        <Link href={`/ecommerce/orders/${message.orderId}`} className="font-medium text-primary underline-offset-2 hover:underline">
          {t("viewOrder")}
        </Link>
      </div>
    </div>
  );
}

/**
 * The cards `reply_with_products` sent: photo, name, the line under it, and the product's page on the
 * shop's website. Light cards on the shop's dark bubble, so they read like the customer's Messenger.
 */
function ProductCards({ cards }: { cards: InboxMessage["attachments"] }) {
  const t = useTranslations("inbox.thread");
  return (
    <div role="list" aria-label={t("productCards")} className="flex gap-2 overflow-x-auto pb-1">
      {cards.map((card, index) => (
        <div
          key={card.productId ?? index}
          role="listitem"
          className="w-40 shrink-0 overflow-hidden rounded-lg border bg-background text-foreground"
        >
          {card.imageUrl && (
            // A plain <img>: the shop's own image host, not on Next's image allow-list.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.imageUrl} alt={card.title ?? ""} className="aspect-square w-full object-cover" />
          )}
          <div className="space-y-0.5 p-2">
            <p className="line-clamp-2 text-xs font-medium">{card.title}</p>
            {card.subtitle && <p className="text-[11px] text-muted-foreground">{card.subtitle}</p>}
            {card.url && (
              <a
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary underline-offset-2 hover:underline"
              >
                {t("viewOnWebsite")}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * A photo shows while Meta's CDN URL still works; those URLs expire, so a broken one — and
 * every non-image attachment — falls back to a line pointing at Meta Business Suite.
 */
function Attachment({ type, url }: { type: string; url?: string }) {
  const t = useTranslations("inbox.thread");
  const [broken, setBroken] = useState(false);
  const label = t(`attachment.${attachmentKind(type)}`);

  if (type === "image" && url && !broken) {
    return (
      // A plain <img>: the URL is Meta's, short-lived, and not on Next's image allow-list.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={label}
        onError={() => setBroken(true)}
        className="max-h-64 rounded-lg object-contain"
        referrerPolicy="no-referrer"
      />
    );
  }
  return <p className="italic opacity-80">{t("openInMeta", { type: label })}</p>;
}
