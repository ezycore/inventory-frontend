// coding-standard: maintained
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PREVIEW_THEME_MESSAGE } from "@/lib/storefront-preview";
import { PreviewThemeBridge } from "@/components/storefront/preview-theme-bridge";
import {
  StorefrontUIProvider,
  setPreviewTheme,
  useStorefrontUI,
} from "@/services/storefront/ui-context";

/**
 * The editor's light/dark toggle, seen from inside the preview frame. What must
 * hold: only the frame's own parent drives it, only in a preview frame, the
 * override beats whatever this browser stored for the shop, and the shopper's
 * own toggle inside the frame takes it back.
 */
function Probe() {
  const { theme, toggleTheme } = useStorefrontUI();
  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  );
}

const renderFrame = () =>
  render(
    <StorefrontUIProvider>
      <Probe />
      <PreviewThemeBridge />
    </StorefrontUIProvider>,
  );

const post = (theme: unknown, source: MessageEventSource | null = window.parent) =>
  act(() => {
    window.dispatchEvent(
      new MessageEvent("message", { data: { type: PREVIEW_THEME_MESSAGE, payload: { theme } }, source }),
    );
  });

describe("PreviewThemeBridge", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/shop/pages/eid?preview=1");
  });

  afterEach(() => {
    setPreviewTheme(null);
    localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  it("draws the theme the editor asks for", () => {
    renderFrame();
    expect(screen.getByRole("button")).toHaveTextContent("light");

    post("dark");

    expect(screen.getByRole("button")).toHaveTextContent("dark");
  });

  it("outranks the theme this browser stored for the shop", () => {
    localStorage.setItem("ezy-sf-theme", "dark");
    renderFrame();
    expect(screen.getByRole("button")).toHaveTextContent("dark");

    post("light");

    expect(screen.getByRole("button")).toHaveTextContent("light");
  });

  it("gives the theme back to the shopper's own toggle, and stores that", async () => {
    renderFrame();
    post("dark");

    await userEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toHaveTextContent("light");
    expect(localStorage.getItem("ezy-sf-theme")).toBe("light");
  });

  it("ignores a theme from anywhere but the frame's parent", () => {
    renderFrame();

    post("dark", null);

    expect(screen.getByRole("button")).toHaveTextContent("light");
  });

  it("ignores the editor outside a preview frame", () => {
    window.history.replaceState(null, "", "/shop/pages/eid");
    renderFrame();

    post("dark");

    expect(screen.getByRole("button")).toHaveTextContent("light");
  });
});
