"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import {
  getRootDomain,
  isValidOrganizationSlug,
  signupUrl,
  workspaceUrl,
} from "@/lib/organization-utils";
import {
  findWorkspacesByEmail,
  lookupWorkspace,
  type FoundWorkspace,
} from "@/lib/workspace-status-client";
import { LoginNotices } from "./login-notices";
import { Alert, AlertDescription } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Shown on the no-workspace host (apex / `app.ezycore.com`) when a root domain is
 * configured. Sessions are per-origin, so instead of logging in here we route the
 * user to their workspace subdomain and let them authenticate there once.
 *
 * Primary flow finds the workspace(s) by the user's email (people forget slugs,
 * not emails): one match redirects straight to that workspace's login, several
 * render a pick list. Entering the workspace name directly stays as a fallback.
 */
export function WorkspaceChooser({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("auth.workspaceChooser");
  const [mode, setMode] = useState<"email" | "slug">("email");
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState("");
  const [workspaces, setWorkspaces] = useState<FoundWorkspace[] | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rootDomain = getRootDomain();

  // Cross-origin hop — full page load to the workspace login. The spinner stays
  // on while the browser navigates.
  const goToWorkspace = (workspaceSlug: string) => {
    setIsChecking(true);
    window.location.assign(workspaceUrl(workspaceSlug, "/login"));
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsChecking(true);

    const result = await findWorkspacesByEmail(email.trim().toLowerCase());

    if (result.kind === "ok") {
      if (result.workspaces.length === 1) {
        goToWorkspace(result.workspaces[0].slug);
        return;
      }
      setIsChecking(false);
      if (result.workspaces.length === 0) {
        setError(t("errors.noWorkspaceForEmail"));
      } else {
        setWorkspaces(result.workspaces);
      }
      return;
    }

    setIsChecking(false);
    setError(
      result.kind === "ratelimited"
        ? t("errors.rateLimited")
        : t("errors.generic"),
    );
  };

  const handleSlugSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalized = slug.trim().toLowerCase();

    if (!isValidOrganizationSlug(normalized)) {
      setError(t("errors.invalidSlug"));
      return;
    }

    setError(null);
    setIsChecking(true);
    const result = await lookupWorkspace(normalized);

    if (result.kind === "ok") {
      goToWorkspace(normalized);
      return;
    }

    setIsChecking(false);
    if (result.kind === "notfound") {
      setError(t("errors.workspaceNotFound"));
    } else if (result.kind === "unavailable") {
      setError(t("errors.workspaceUnavailable"));
    } else {
      setError(t("errors.generic"));
    }
  };

  const switchMode = (next: "email" | "slug") => {
    setMode(next);
    setError(null);
  };

  // Pick list: the email belongs to several workspaces.
  if (workspaces) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <LoginNotices />
        <Card>
          <CardHeader>
            <CardTitle>{t("chooseTitle")}</CardTitle>
            <CardDescription>
              {t("chooseDescription", { email, count: workspaces.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.slug}
                  type="button"
                  onClick={() => goToWorkspace(workspace.slug)}
                  disabled={isChecking}
                  className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 font-semibold uppercase text-primary">
                    {workspace.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {workspace.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {workspace.slug}
                      {rootDomain ? `.${rootDomain}` : ""}
                    </span>
                  </span>
                  {isChecking && (
                    <Loader2 className="ml-auto h-4 w-4 shrink-0 animate-spin" />
                  )}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => setWorkspaces(null)}
              disabled={isChecking}
            >
              {t("useOtherEmail")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <LoginNotices />
      <Card>
        <CardHeader>
          <CardTitle>{t("findTitle")}</CardTitle>
          <CardDescription>
            {mode === "email"
              ? t("findByEmailDescription")
              : t("findBySlugDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={mode === "email" ? handleEmailSubmit : handleSlugSubmit}>
            <div className="flex flex-col gap-6">
              {mode === "email" ? (
                <div className="grid gap-3">
                  <Label htmlFor="workspace-email">{t("emailLabel")}</Label>
                  <Input
                    id="workspace-email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              ) : (
                <div className="grid gap-3">
                  <Label htmlFor="workspace">{t("workspaceLabel")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="workspace"
                      type="text"
                      placeholder={t("workspacePlaceholder")}
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      autoFocus
                      required
                    />
                    {rootDomain && (
                      <span className="whitespace-nowrap text-sm text-muted-foreground">
                        .{rootDomain}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isChecking}>
                {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isChecking ? t("checking") : t("continue")}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              {mode === "email" ? (
                <button
                  type="button"
                  className="text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => switchMode("slug")}
                >
                  {t("knowWorkspaceName")}
                </button>
              ) : (
                <button
                  type="button"
                  className="text-muted-foreground underline-offset-4 hover:underline"
                  onClick={() => switchMode("email")}
                >
                  {t("forgotWorkspaceName")}
                </button>
              )}
            </div>

            <div className="mt-2 text-center text-sm">
              {t("noAccount")}{" "}
              <Link href={signupUrl()} className="underline underline-offset-4">
                {t("signUp")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
