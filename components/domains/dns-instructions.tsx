"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { OrganizationDomain } from "@/types";
import { CopyField } from "@/ui/components/copy";
import { Info } from "lucide-react";

/** Where custom subdomains should CNAME to, and the apex A-record target. */
const CNAME_TARGET = "connect.ezycore.com";
const APEX_IP = "139.99.90.41";
const VERIFY_PREFIX = "_ezycore-verify";

interface DnsRecordRowProps {
  type: string;
  name: string;
  value: string;
}

function DnsRecordRow({ type, name, value }: DnsRecordRowProps) {
  const t = useTranslations("settings.domains.dns");
  return (
    <div className="grid grid-cols-[70px_1fr] gap-x-4 gap-y-1 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-[80px_180px_1fr]">
      <span className="font-medium text-muted-foreground">{t("type")}</span>
      <span className="hidden font-medium text-muted-foreground sm:block">
        {t("nameHost")}
      </span>
      <span className="hidden font-medium text-muted-foreground sm:block">
        {t("value")}
      </span>

      <span className="font-mono">{type}</span>
      <CopyField value={name} className="col-span-1 min-w-0 break-all" />
      <CopyField
        value={value}
        className="col-span-2 min-w-0 break-all sm:col-span-1"
      />
    </div>
  );
}

/**
 * The `www.` CNAME, shown on its own because it is the one record that still
 * matters **after** the domain goes active — and the rest of these instructions
 * disappear at that point. A merchant who activates without it has a `www` that
 * gets no certificate, which a browser reports as a security warning rather than
 * a broken link, and nothing in the app would ever tell them why.
 *
 * Apex only: nobody types `www.shop.acme.com`. No second domain entry is needed
 * either — the twin is derived server-side, exactly like the `admin.` host
 * (`WWW_HOST_PREFIX`, backend `utils/tenant-host.ts`).
 */
export function WwwDnsRecord({
  domain,
  step,
}: {
  domain: string;
  step: string;
}) {
  const t = useTranslations("settings.domains.dns");
  if (domain.split(".").length > 2) return null;

  return (
    <div>
      <p className="mb-1 text-sm font-medium">{step}</p>
      <DnsRecordRow type="CNAME" name="www" value={CNAME_TARGET} />
      <p className="mt-1 text-xs text-muted-foreground">
        {t("wwwHint", { domain })}
      </p>
    </div>
  );
}

/**
 * Manual DNS setup for one custom domain: the ownership TXT record plus the
 * pointing record (CNAME for a subdomain, A for an apex). See CUSTOM-DOMAINS-P1.md.
 */
export function DnsInstructions({ domain }: { domain: OrganizationDomain }) {
  const t = useTranslations("settings.domains.dns");
  const parts = domain.domain.split(".");
  const isApex = parts.length <= 2;
  const label = parts.slice(0, parts.length - 2).join(".");
  const txtName = isApex ? VERIFY_PREFIX : `${VERIFY_PREFIX}.${label}`;
  // Admin app convention: `admin.<domain>`. As a DNS record on the domain's
  // zone that's `admin` at the apex, or `admin.<label>` under a subdomain.
  const adminName = isApex ? "admin" : `admin.${label}`;
  // The `www.` twin is derived server-side exactly like the admin host, so it
  // needs no second domain entry — only this DNS record. Offered on an apex
  // only: nobody types `www.shop.acme.com`.

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-sm font-medium">{t("verifyStep")}</p>
        <DnsRecordRow
          type="TXT"
          name={txtName}
          value={domain.verificationToken}
        />
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">{t("pointStep")}</p>
        {isApex ? (
          <DnsRecordRow type="A" name="@" value={APEX_IP} />
        ) : (
          <DnsRecordRow type="CNAME" name={label} value={CNAME_TARGET} />
        )}
      </div>

      <div>
        <p className="mb-1 text-sm font-medium">{t("adminStep")}</p>
        <DnsRecordRow type="CNAME" name={adminName} value={CNAME_TARGET} />
        <p className="mt-1 text-xs text-muted-foreground">
          {t("adminHint", { domain: domain.domain })}
        </p>
      </div>

      <WwwDnsRecord domain={domain.domain} step={t("wwwStep")} />

      <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {t.rich("cloudflareWarning", {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
      </div>
    </div>
  );
}
