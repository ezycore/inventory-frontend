// coding-standard: maintained
import { fireEvent, renderWithProviders as render, screen } from "@/tests/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StorefrontPageListItem } from "@/services/api";
import { getReadyMadeTheme } from "@/lib/storefront-themes";

const push = vi.fn();
const start = vi.fn();
let home: Partial<StorefrontPageListItem> | undefined;

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/services/api", () => ({
  useStartHomeFromTheme: () => ({ mutate: start, isPending: false }),
  useStoreHomePageRow: () => ({ home, isLoading: false }),
}));

import { ApplyThemeDialog } from "./apply-theme-dialog";

const showroom = getReadyMadeTheme("showroom")!;
const renderDialog = (props: { landingIsHomepage?: boolean } = {}) =>
  render(<ApplyThemeDialog theme={showroom} open onOpenChange={vi.fn()} {...props} />);
const homeOption = () => screen.getByRole("button", { name: /start the home page from this theme/i });
const continueButton = () => screen.getByRole("button", { name: "Preview in Customize" });

beforeEach(() => {
  push.mockReset();
  start.mockReset();
  home = { _id: "home-id", systemKey: "home", hasDraft: false, draftTheme: null };
});

describe("ApplyThemeDialog", () => {
  it("changes the look only by default, as applying a theme always has", () => {
    renderDialog();

    fireEvent.click(continueButton());

    expect(start).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/ecommerce/customize?theme=showroom");
  });

  it("starts the home page from the theme first, then opens Customize", () => {
    start.mockImplementation((_theme: string, options: { onSuccess: () => void }) => options.onSuccess());
    renderDialog();

    fireEvent.click(homeOption());
    fireEvent.click(continueButton());

    expect(start).toHaveBeenCalledWith("showroom", expect.anything());
    expect(push).toHaveBeenCalledWith("/ecommerce/customize?theme=showroom");
  });

  // A draft is not in the history: replacing the merchant's own would lose it.
  it("waits for the merchant's own unpublished home edits", () => {
    home = { _id: "home-id", systemKey: "home", hasDraft: true, draftTheme: null };
    renderDialog();

    fireEvent.click(homeOption());

    expect(continueButton()).toBeDisabled();
    expect(screen.getByRole("link", { name: "Open your home page" })).toHaveAttribute(
      "href",
      "/ecommerce/pages/home-id",
    );
  });

  it("may replace a draft a theme wrote", () => {
    home = { _id: "home-id", systemKey: "home", hasDraft: true, draftTheme: "showroom" };
    renderDialog();

    fireEvent.click(homeOption());

    expect(continueButton()).toBeEnabled();
  });

  it("says in place when the backend refuses, and stays put", () => {
    start.mockImplementation((_theme: string, options: { onError: (error: unknown) => void }) =>
      options.onError({ status: 409, code: "STOREFRONT_HOME_HAS_DRAFT", message: "Your home page has unpublished changes." }),
    );
    renderDialog();

    fireEvent.click(homeOption());
    fireEvent.click(continueButton());

    expect(screen.getByRole("alert")).toHaveTextContent("Publish or discard them first");
    expect(push).not.toHaveBeenCalled();
  });

  it("notes when a landing page is what shoppers see at the store's address", () => {
    renderDialog({ landingIsHomepage: true });

    fireEvent.click(homeOption());

    expect(screen.getByText(/shows a landing page/)).toBeInTheDocument();
  });
});
