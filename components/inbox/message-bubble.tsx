"use client";
// coding-standard: maintained

import { useFormatters } from "@/hooks/use-formatters";
import type { InboxMessage } from "@/services/api";
import { cn } from "@/ui/lib/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { attachmentKind } from "./inbox-utils";

/**
 * One message. The customer's sit left, the shop's right. A reply typed in Meta's own inbox
 * (`source: "platform_inbox"`) says so, and so does one the AI wrote (`role: "ai"`) — staff
 * otherwise cannot tell either from one they sent here.
 */
export function MessageBubble({ message }: { message: InboxMessage }) {
  const t = useTranslations("inbox.thread");
  const { formatDateTime } = useFormatters();
  const fromShop = message.role !== "customer";

  return (
    <div className={cn("flex", fromShop ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] space-y-1 rounded-2xl px-3 py-2 text-sm",
          fromShop ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted",
        )}
      >
        {message.attachments.map((attachment, index) => (
          <Attachment key={index} type={attachment.type} url={attachment.url} />
        ))}
        {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
        <p className={cn("text-[11px]", fromShop ? "text-primary-foreground/75" : "text-muted-foreground")}>
          {formatDateTime(message.at)}
          {message.source === "platform_inbox" && ` · ${t("fromFacebook")}`}
          {message.role === "ai" && ` · ${t("fromAi")}`}
        </p>
      </div>
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
