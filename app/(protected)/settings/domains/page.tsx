"use client";
// coding-standard: maintained
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
        toast.success("Domain added", {
          description: "Add the DNS records shown, then re-check.",
        });
        setNewDomain("");
      },
      onError: (error) =>
        toast.error("Could not add domain", {
          description: errMessage(error, "Please try again."),
        }),
    });
  };

  const handleVerify = (domain: string) => {
    setPendingDomain(domain);
    verifyDomain.mutate(domain, {
      onSuccess: () => toast.success("Domain verified"),
      onError: (error) =>
        toast.error("Verification failed", {
          description: errMessage(
            error,
            "TXT record not found yet — DNS may still be propagating.",
          ),
        }),
      onSettled: () => setPendingDomain(null),
    });
  };

  const handleRemove = (domain: string) => {
    setPendingDomain(domain);
    removeDomain.mutate(domain, {
      onSuccess: () => toast.success("Domain removed"),
      onError: (error) =>
        toast.error("Could not remove domain", {
          description: errMessage(error, "Please try again."),
        }),
      onSettled: () => setPendingDomain(null),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Domains"
        subTitle="Connect your own domain to this workspace. Add the DNS records we show, then verify ownership."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a domain</CardTitle>
          <CardDescription>
            e.g. shop.yourbrand.com — a subdomain you control.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="shop.yourbrand.com"
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
              Add
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
          <p className="text-sm">No custom domains yet.</p>
        </div>
      )}
    </div>
  );
}
