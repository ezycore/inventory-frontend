// coding-standard: maintained
/**
 * The phone menu — the only category navigation a phone has, and the surface
 * the owner's complaint was about: two departments with forty sub-categories
 * printed fully expanded, with no way to fold them (plan
 * `storefront-menu-controls.md`, M2). Accordion is now every shop's default
 * (owner decision A), so what is pinned here is that each layout keeps the
 * parent's own page reachable — the easy thing to lose when a row becomes a
 * toggle instead of a link.
 */
import Link from "next/link";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MenuTreeList } from "@/components/storefront/mobile/mobile-menu-tree";
import {
  DEFAULT_MENU_SETTINGS,
  type MenuNode,
  type ResolvedMenuSettings,
} from "@/lib/storefront-menu";

const state = { pathname: "/" };
vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
}));

const cat = (id: string, label: string, path: string, children: MenuNode[] = []): MenuNode => ({
  key: `cat:${id}`,
  label,
  href: `/${path}`,
  external: false,
  path,
  children,
});

const NODES: MenuNode[] = [
  cat("mats", "Floor mats", "mats", [cat("round", "Round", "mats/round"), cat("square", "Square", "mats/square")]),
  cat("cush", "Cushions", "cushions", [cat("velvet", "Velvet", "cushions/velvet")]),
  { key: "item:2", label: "About", href: "/pages/about", external: false, children: [] },
];

const phone = (p: Partial<ResolvedMenuSettings["mobile"]> = {}) => ({
  ...DEFAULT_MENU_SETTINGS.mobile,
  ...p,
});

const renderTree = (settings = phone()) =>
  render(<MenuTreeList nodes={NODES} settings={settings} onClose={() => {}} />);

describe("MenuTreeList — accordion (the default)", () => {
  it("opens the first group on the home page and folds the rest", () => {
    state.pathname = "/";
    renderTree();
    expect(screen.getByText("Round")).toBeInTheDocument();
    expect(screen.queryByText("Velvet")).toBeNull();
  });

  it("opens the department the shopper is browsing instead", () => {
    state.pathname = "/cushions/velvet";
    renderTree();
    expect(screen.getByText("Velvet")).toBeInTheDocument();
    expect(screen.queryByText("Round")).toBeNull();
  });

  it("folds a group open and shut with its row", () => {
    state.pathname = "/";
    renderTree();
    const row = screen.getByRole("button", { name: /Cushions/ });
    fireEvent.click(row);
    expect(row).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Velvet")).toBeInTheDocument();
    fireEvent.click(row);
    expect(screen.queryByText("Velvet")).toBeNull();
  });

  it("keeps the parent's page one tap away through its All row", () => {
    state.pathname = "/";
    renderTree();
    expect(screen.getByText("All Floor mats").closest("a")).toHaveAttribute("href", "/mats");
  });

  it("without the All row, the label stays a link and a chevron folds it", () => {
    state.pathname = "/";
    renderTree(phone({ viewAll: false }));
    expect(screen.getByText("Floor mats").closest("a")).toHaveAttribute("href", "/mats");
    fireEvent.click(screen.getByRole("button", { name: "Show Cushions sub-categories" }));
    expect(screen.getByText("Velvet")).toBeInTheDocument();
  });

  it("'None' starts with every group folded", () => {
    state.pathname = "/";
    renderTree(phone({ open: "none" }));
    expect(screen.queryByText("Round")).toBeNull();
  });

  it("keeps the current department open whatever the open setting says", () => {
    // Owner rule: a shopper on Cushions › Velvet who opens the menu finds
    // Velvet, not a folded Cushions.
    state.pathname = "/cushions/velvet";
    renderTree(phone({ open: "none" }));
    expect(screen.getByText("Velvet")).toBeInTheDocument();
  });

  it("marks the current sub-category as the page", () => {
    state.pathname = "/cushions/velvet";
    renderTree();
    expect(screen.getByText("Velvet").closest("a")).toHaveAttribute("aria-current", "page");
    // Floor mats is folded; its department row is only named, not marked.
    expect(screen.queryByText("Round")).toBeNull();
  });

  it("marks the All row when the shopper is on the department itself", () => {
    state.pathname = "/cushions";
    renderTree();
    expect(screen.getByText("All Cushions").closest("a")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Velvet").closest("a")).not.toHaveAttribute("aria-current");
  });

  it("leaves a link without children a plain link", () => {
    renderTree();
    expect(screen.getByText("About").closest("a")).toHaveAttribute("href", "/pages/about");
  });

  it("draws a chevron only on rows that have a sub-menu", () => {
    state.pathname = "/";
    renderTree();
    expect(screen.getByText("About").closest("a")?.querySelector("svg")).toBeNull();
    expect(screen.getByText("Round").closest("a")?.querySelector("svg")).toBeNull();
    expect(screen.getByRole("button", { name: /Cushions/ }).querySelector("svg")).not.toBeNull();
  });
});

describe("MenuTreeList — the other layouts", () => {
  it("step in: a category opens its own screen, and Back returns", () => {
    state.pathname = "/";
    renderTree(phone({ layout: "drill" }));
    expect(screen.queryByText("Round")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Floor mats/ }));
    expect(screen.getByText("Round")).toBeInTheDocument();
    expect(screen.queryByText("Cushions")).toBeNull();
    expect(screen.getByText("All Floor mats").closest("a")).toHaveAttribute("href", "/mats");
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.getByText("Cushions")).toBeInTheDocument();
  });

  it("step in: opens on the current department's screen", () => {
    state.pathname = "/cushions/velvet";
    renderTree(phone({ layout: "drill" }));
    expect(screen.getByText("Velvet").closest("a")).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText("Floor mats")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.getByText("Floor mats")).toBeInTheDocument();
  });

  it("step in: the lead row stays on the top screen, never above Back", () => {
    state.pathname = "/";
    render(
      <MenuTreeList
        nodes={NODES}
        settings={phone({ layout: "drill" })}
        onClose={() => {}}
        lead={<Link href="/products">All products</Link>}
      />,
    );
    expect(screen.getByText("All products")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Floor mats/ }));
    expect(screen.queryByText("All products")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Back/ }));
    expect(screen.getByText("All products")).toBeInTheDocument();
  });

  it("show all: every group open, parents as links — the list as it was", () => {
    renderTree(phone({ layout: "expanded" }));
    expect(screen.getByText("Round")).toBeInTheDocument();
    expect(screen.getByText("Velvet")).toBeInTheDocument();
    expect(screen.getByText("Cushions").closest("a")).toHaveAttribute("href", "/cushions");
  });

  it("draws sub-category pictures only when that switch is on", () => {
    state.pathname = "/";
    const withImages = NODES.map((n) => ({
      ...n,
      image: "https://cdn.test/p.webp",
      children: n.children.map((c) => ({ ...c, image: "https://cdn.test/c.webp" })),
    }));
    const { container, rerender } = render(
      <MenuTreeList nodes={withImages} settings={phone({ layout: "expanded", images: true })} onClose={() => {}} />,
    );
    const pics = () => [...container.querySelectorAll("img")].map((i) => i.getAttribute("src") ?? "");
    expect(pics().some((src) => src.includes("c.webp"))).toBe(false);
    rerender(
      <MenuTreeList nodes={withImages} settings={phone({ layout: "expanded", images: true, subImages: true })} onClose={() => {}} />,
    );
    expect(pics().some((src) => src.includes("c.webp"))).toBe(true);
  });
});
