"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { OrganizationDomain } from "@/types";
import { CopyField } from "@/ui/components/copy";
import { Info } from "lucide-react";

/** Where custom subdomains should CNAME to, and the apex A-record target. */
const CNAME_TARGET = "connect.ezycore.com";
const APEX_IP = "178.128.101.0";
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

      <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
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
