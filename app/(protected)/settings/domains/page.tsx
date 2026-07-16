"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import {
  useAddDomain,
  useDomains,
  useRemoveDomain,
  useVerifyDomain,
} from "@/services/api";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import PageHeader from "@/ui/components/header";
import { Input } from "@/ui/components/input";
import { DomainCard } from "@/components/domains/domain-card";
import { Globe, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const errMessage = (error: unknown, fallback: string): string =>
  (error as { message?: string })?.message || fallback;

export default function DomainsSettingsPage() {
  const t = useTranslations("settings.domains");
  const [newDomain, setNewDomain] = useState("");
  const [pendingDomain, setPendingDomain] = useState<string | null>(null);

  const { data: domains, isLoading } = useDomains();
  const addDomain = useAddDomain();
  const verifyDomain = useVerifyDomain();
  const removeDomain = useRemoveDomain();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const value = newDomain.trim().toLowerCase();
    if (!value) return;
    addDomain.mutate(value, {
      onSuccess: () => {
        toast.success(t("toasts.added"), {
          description: t("toasts.addedDescription"),
        });
        setNewDomain("");
      },
      onError: (error) =>
        toast.error(t("toasts.addFailed"), {
          description: errMessage(error, t("toasts.addFailedDescription")),
        }),
    });
  };

  const handleVerify = (domain: string) => {
    setPendingDomain(domain);
    verifyDomain.mutate(domain, {
      onSuccess: (res) =>
        res.data?.domain?.status === "active"
          ? toast.success(t("toasts.activated"), {
              description: t("toasts.activatedDescription"),
            })
          : toast.success(t("toasts.verified"), {
              description: t("toasts.verifiedDescription"),
            }),
      onError: (error) =>
        toast.error(t("toasts.verifyFailed"), {
          description: errMessage(
            error,
            t("toasts.verifyFailedDescription"),
          ),
        }),
      onSettled: () => setPendingDomain(null),
    });
  };

  const handleRemove = (domain: string) => {
    setPendingDomain(domain);
    removeDomain.mutate(domain, {
      onSuccess: () => toast.success(t("toasts.removed")),
      onError: (error) =>
        toast.error(t("toasts.removeFailed"), {
          description: errMessage(error, t("toasts.addFailedDescription")),
        }),
      onSettled: () => setPendingDomain(null),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("addTitle")}</CardTitle>
          <CardDescription>
            {t("addDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder={t("placeholder")}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <Button type="submit" disabled={addDomain.isPending}>
              {addDomain.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t("addButton")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : domains && domains.length > 0 ? (
        <div className="space-y-4">
          {domains.map((domain) => (
            <DomainCard
              key={domain.domain}
              domain={domain}
              onVerify={handleVerify}
              onRemove={handleRemove}
              isVerifying={
                verifyDomain.isPending && pendingDomain === domain.domain
              }
              isRemoving={
                removeDomain.isPending && pendingDomain === domain.domain
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          <Globe className="h-8 w-8" />
          <p className="text-sm">{t("empty")}</p>
        </div>
      )}
    </div>
  );
}
