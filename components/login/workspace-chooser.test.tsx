import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import { renderWithProviders, screen, waitFor } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { WorkspaceChooser } from "./workspace-chooser";

// The chooser renders LoginNotices (useSearchParams) and a signup Link; neither
// has an app router in the test tree.
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<"a">) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const workspace = (name: string, slug: string) => ({
  name,
  slug,
  logoUrl: null,
});

const findWorkspaces = (workspaces: unknown[], status = 200) =>
  http.post("*/api/auth/find-workspaces", () =>
    status === 200
      ? HttpResponse.json({ success: true, data: { workspaces } })
      : new HttpResponse(null, { status }),
  );

let hrefSpy: string;
const originalLocation = window.location;

beforeEach(() => {
  // Root domain drives the apex chooser + redirect URLs (baked env in prod).
  vi.stubEnv("NEXT_PUBLIC_ROOT_DOMAIN", "ezycore.com");
  hrefSpy = "";
  // jsdom does not implement navigation; swap location for a capturable stub.
  // `protocol` is read by workspaceUrl when building the redirect target.
  // `assign` must be overridden too — the spread copies jsdom's real assign,
  // which throws when called with the stub as `this`.
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...originalLocation,
      protocol: "http:",
      assign(v: string) {
        hrefSpy = v;
      },
      set href(v: string) {
        hrefSpy = v;
      },
      get href() {
        return hrefSpy;
      },
    },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

async function submitEmail(email: string) {
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.click(screen.getByRole("button", { name: /continue/i }));
}

describe("WorkspaceChooser", () => {
  it("redirects straight to the workspace login for a single-workspace email", async () => {
    server.use(findWorkspaces([workspace("Acme", "acme")]));
    renderWithProviders(<WorkspaceChooser />);

    await submitEmail("owner@acme.com");

    await waitFor(() =>
      expect(hrefSpy).toBe(
        "http://acme.ezycore.com/login?email=owner%40acme.com",
      ),
    );
  });

  it("lists workspaces for a multi-workspace email and redirects on pick", async () => {
    server.use(
      findWorkspaces([workspace("Acme", "acme"), workspace("Beta", "beta")]),
    );
    renderWithProviders(<WorkspaceChooser />);

    await submitEmail("owner@acme.com");

    expect(await screen.findByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("beta.ezycore.com")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Beta"));
    await waitFor(() =>
      expect(hrefSpy).toBe(
        "http://beta.ezycore.com/login?email=owner%40acme.com",
      ),
    );
  });

  it("shows a not-found message when the email has no workspaces", async () => {
    server.use(findWorkspaces([]));
    renderWithProviders(<WorkspaceChooser />);

    await submitEmail("ghost@example.com");

    expect(
      await screen.findByText(/no workspace found for this email/i),
    ).toBeInTheDocument();
    expect(hrefSpy).toBe("");
  });

  it("shows a slow-down message when rate limited", async () => {
    server.use(findWorkspaces([], 429));
    renderWithProviders(<WorkspaceChooser />);

    await submitEmail("owner@acme.com");

    expect(await screen.findByText(/too many attempts/i)).toBeInTheDocument();
  });

  it("still supports the workspace-name fallback lookup", async () => {
    server.use(
      http.get("*/api/public/orgs/acme/status", () =>
        HttpResponse.json({
          success: true,
          data: { exists: true, status: "active" },
        }),
      ),
    );
    renderWithProviders(<WorkspaceChooser />);

    await userEvent.click(
      screen.getByRole("button", { name: /know your workspace name/i }),
    );
    await userEvent.type(screen.getByLabelText(/workspace/i), "acme");
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() =>
      expect(hrefSpy).toBe("http://acme.ezycore.com/login"),
    );
  });
});
