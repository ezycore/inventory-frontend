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
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { DnsInstructions } from "./dns-instructions";

/** Map a domain status to a StatusBadge variant (`verifying` has no variant). */
const badgeStatus = (
  status: OrganizationDomainStatus,
): StatusBadgeProps["status"] =>
  status === "verifying" ? "processing" : status;

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
