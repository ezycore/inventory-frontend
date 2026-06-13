import { getRootDomain } from "@/lib/organization-utils";

/**
 * Full-screen page shown when a workspace subdomain doesn't exist or is disabled.
 * Rendered **server-side** by the root layout (see lib/workspace-status.ts), so it
 * replaces the app entirely — no flash of the login/app first.
 */
export function WorkspaceGateScreen({
  kind,
  host,
}: {
  kind: "notfound" | "unavailable";
  host: string;
}) {
  const notFound = kind === "notfound";
  const root = getRootDomain();
  const homeUrl = root ? `https://${root}` : "/";

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {notFound ? "Workspace not found" : "Workspace unavailable"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {notFound ? (
            <>
              There&apos;s no workspace at{" "}
              <span className="font-medium text-foreground">{host}</span>. Check the
              address, or head to our home page.
            </>
          ) : (
            <>
              The workspace at{" "}
              <span className="font-medium text-foreground">{host}</span> is currently
              unavailable. Please contact your administrator.
            </>
          )}
        </p>
        <a
          href={homeUrl}
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          Go to {root || "home"}
        </a>
      </div>
    </div>
  );
}
