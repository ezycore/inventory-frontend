// coding-standard: maintained
/**
 * The header menu's HOVER SEAM.
 *
 * `topLink` / `dropLink` were `CSSProperties` objects applied inline, which set
 * `color` on the element itself — and an inline declaration outranks every rule
 * in `storefront.css`, so the merchant's hover effect could never have taken
 * hold no matter how the stylesheet was written. The fix was to move both into
 * classes; what is pinned here is that they STAY there, because the failure is
 * silent: the header keeps looking exactly right and only the effect the
 * merchant chose is missing.
 *
 * jsdom computes no cascade, so this asserts the contract rather than the
 * pixels — the class the stylesheet selects is present, and no inline colour
 * sits in front of it.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HeaderNav } from "@/components/storefront/header-nav";
import {
  DEFAULT_MENU_SETTINGS,
  type MenuNode,
  type ResolvedMenuSettings,
} from "@/lib/storefront-menu";

const nav = { pathname: "/" };
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

const node = (label: string, href: string, children: MenuNode[] = [], external = false): MenuNode => ({
  key: label,
  label,
  href,
  external,
  children,
});

const NODES: MenuNode[] = [
  node("Shop", "/skin-care", [node("Serums", "/skin-care/serums")]),
  node("Blog", "https://example.com/blog", [], true),
];

const desktop = (p: Partial<ResolvedMenuSettings["desktop"]> = {}) => ({
  ...DEFAULT_MENU_SETTINGS.desktop,
  ...p,
});

const renderNav = (menu = desktop()) => render(<HeaderNav nodes={NODES} menu={menu} />);

/** The wrapper that carries the open/close handlers — the link's parent. */
const itemOf = (label: string) =>
  screen.getByText(label).closest("a, button")?.parentElement as HTMLElement;

describe("HeaderNav — what the stylesheet can reach", () => {
  it("gives every top-level item the class the hover rules select", () => {
    renderNav();
    // Both kinds: a shop link and a merchant-typed URL, which render through
    // different branches of `NavLink` (`Link` vs a raw `<a>`) and would be easy
    // to fix in one and miss in the other.
    expect(screen.getByText("Shop").closest("a")).toHaveClass("sf-nav-top");
    expect(screen.getByText("Blog").closest("a")).toHaveClass("sf-nav-top");
  });

  it("gives a dropdown item its own class, answered separately", () => {
    renderNav();
    // Hover-mounted, so open it the way a pointer does.
    fireEvent.pointerEnter(itemOf("Shop"), { pointerType: "mouse" });
    const child = screen.getByText("Serums").closest("a");
    expect(child).toHaveClass("sf-nav-child");
    expect(child).not.toHaveClass("sf-nav-top");
  });

  it("puts no inline colour in front of the merchant's hover choice", () => {
    renderNav();
    // The whole bug: `color` set inline beats every rule in the stylesheet, so
    // `:hover { color: var(--primary) }` would silently do nothing.
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("style") ?? "").not.toContain("color");
    }
  });
});

describe("HeaderNav — how a dropdown opens (Customize → Menu)", () => {
  it("hover: the list opens on a mouse and shows no extra row", () => {
    renderNav();
    fireEvent.pointerEnter(itemOf("Shop"), { pointerType: "mouse" });
    expect(screen.getByText("Serums")).toBeInTheDocument();
    expect(screen.queryByText("All Shop")).toBeNull();
  });

  it("hover: a touch never opens it by emulated hover", () => {
    renderNav();
    fireEvent.pointerEnter(itemOf("Shop"), { pointerType: "touch" });
    expect(screen.queryByText("Serums")).toBeNull();
  });

  it("a first TAP on a parent opens the dropdown instead of leaving the page", () => {
    renderNav();
    const top = screen.getByText("Shop").closest("a") as HTMLElement;
    fireEvent.pointerDown(top, { pointerType: "touch" });
    const allowed = fireEvent.click(top);
    expect(allowed).toBe(false); // navigation prevented
    // The skipped page is the panel's first row.
    expect(screen.getByText("All Shop").closest("a")).toHaveAttribute("href", "/skin-care");
  });

  it("click: the trigger is a button and the parent page heads the panel", () => {
    renderNav(desktop({ openOn: "click" }));
    fireEvent.pointerEnter(itemOf("Shop"), { pointerType: "mouse" });
    expect(screen.queryByText("Serums")).toBeNull();
    const trigger = screen.getByRole("button", { name: /Shop/ });
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("All Shop")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Serums")).toBeNull();
  });

  it("mega: pictures, and the layout alone adds no extra row", () => {
    renderNav(desktop({ dropdown: "mega" }));
    fireEvent.pointerEnter(itemOf("Shop"), { pointerType: "mouse" });
    expect(screen.queryByText("All Shop")).toBeNull();
    expect(screen.getByText("Serums").closest("a")).toHaveClass("sf-nav-mega-item");
  });

  it("columns: the layout alone adds no extra row either", () => {
    renderNav(desktop({ dropdown: "columns" }));
    fireEvent.pointerEnter(itemOf("Shop"), { pointerType: "mouse" });
    expect(screen.queryByText("All Shop")).toBeNull();
  });

  it("the merchant's switch heads every layout with the parent's page", () => {
    renderNav(desktop({ dropdown: "list", viewAll: true }));
    fireEvent.pointerEnter(itemOf("Shop"), { pointerType: "mouse" });
    expect(screen.getByText("All Shop").closest("a")).toHaveAttribute("href", "/skin-care");
  });
});

describe("HeaderNav — the page the shopper is on", () => {
  const TREE: MenuNode[] = [
    { ...node("Shop", "/skin-care", [{ ...node("Serums", "/skin-care/serums"), path: "skin-care/serums" }]), path: "skin-care" },
    { ...node("Hair", "/hair"), path: "hair" },
  ];

  it("marks the department holding the page, and no other", () => {
    nav.pathname = "/skin-care/serums";
    render(<HeaderNav nodes={TREE} />);
    expect(screen.getByText("Shop").closest("a")).toHaveClass("sf-current");
    expect(screen.getByText("Hair").closest("a")).not.toHaveClass("sf-current");
    nav.pathname = "/";
  });

  it("marks the current sub-category inside the open dropdown", () => {
    nav.pathname = "/skin-care/serums";
    render(<HeaderNav nodes={TREE} menu={{ ...DEFAULT_MENU_SETTINGS.desktop, openOn: "click" }} />);
    fireEvent.click(screen.getByRole("button", { name: /Shop/ }));
    const serums = screen.getByText("Serums").closest("a");
    expect(serums).toHaveClass("sf-current");
    expect(serums).toHaveAttribute("aria-current", "page");
    nav.pathname = "/";
  });
});
