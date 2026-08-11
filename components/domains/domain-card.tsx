"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { OrganizationDomain, OrganizationDomainStatus } from "@/types";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { StatusBadge, type StatusBadgeProps } from "@/ui/components/status-badge";
import { adminUrlForDomain } from "@/lib/admin-url";
import { ExternalLink, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { DnsInstructions, WwwDnsRecord } from "./dns-instructions";

/** Map a domain status to a StatusBadge variant (`verifying` has no variant). */
const badgeStatus = (
  status: OrganizationDomainStatus,
): StatusBadgeProps["status"] =>
  status === "verifying" ? "processing" : status;

/** One labelled, clickable URL row shown for an active custom domain. */
function UrlRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-w-0 items-center gap-1 truncate font-medium text-primary hover:underline"
      >
        <span className="truncate">{url}</span>
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      </a>
    </div>
  );
}

interface DomainCardProps {
  domain: OrganizationDomain;
  onVerify: (domain: string) => void;
  onRemove: (domain: string) => void;
  isVerifying: boolean;
  isRemoving: boolean;
}

export function DomainCard({
  domain,
  onVerify,
  onRemove,
  isVerifying,
  isRemoving,
}: DomainCardProps) {
  const t = useTranslations("settings.domains.card");
  const isSubdomain = domain.type === "subdomain";
  const isActive = domain.status === "active";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="truncate text-base font-medium">
            {domain.domain}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {isSubdomain ? t("subdomain") : t("custom")}
            {domain.isPrimary && ` · ${t("primary")}`}
          </span>
        </div>
        <StatusBadge status={badgeStatus(domain.status)} />
      </CardHeader>

      {!isSubdomain && (
        <CardContent className="space-y-4">
          {!isActive && <DnsInstructions domain={domain} />}

          {isActive && (
            <div className="flex flex-col gap-1.5 text-sm">
              <UrlRow
                label={t("storefrontUrl")}
                url={`https://${domain.domain}`}
              />
              <UrlRow label={t("adminUrl")} url={adminUrlForDomain(domain.domain)} />
            </div>
          )}

          {/* Stays after activation on purpose — see WwwDnsRecord. A merchant who
              skipped it during setup has no other way back to the record. */}
          {isActive && (
            <WwwDnsRecord domain={domain.domain} step={t("wwwRecord")} />
          )}

          <div className="flex flex-wrap gap-2">
            {!isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVerify(domain.domain)}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {t("recheck")}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onRemove(domain.domain)}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t("remove")}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
