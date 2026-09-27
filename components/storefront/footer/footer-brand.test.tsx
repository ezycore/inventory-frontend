import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FooterBrand, FooterPromises } from "@/components/storefront/footer/footer-pieces";

describe("FooterBrand", () => {
  it("draws the shop name and the about line by default", () => {
    render(<FooterBrand name="Acme" blurb="Cushions delivered across Bangladesh." />);
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Cushions delivered across Bangladesh.")).toBeInTheDocument();
  });

  it("drops the logo and name but keeps the about line when the mark is off", () => {
    render(<FooterBrand name="Acme" blurb="Cushions delivered across Bangladesh." showMark={false} />);
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
    expect(screen.getByText("Cushions delivered across Bangladesh.")).toBeInTheDocument();
  });

  it("renders nothing with neither the mark nor an about line", () => {
    const { container } = render(<FooterBrand name="Acme" showMark={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  // The About box is a textarea; its Enter must reach the shop as a line break.
  it("keeps the line breaks typed in the about text", () => {
    render(<FooterBrand name="Acme" blurb={"Handmade cushions.\nDelivered in 2–3 days."} />);
    const about = screen.getByText(/Handmade cushions\./);
    expect(about.textContent).toBe("Handmade cushions.\nDelivered in 2–3 days.");
    expect(about).toHaveStyle({ whiteSpace: "pre-line" });
  });
});

describe("FooterPromises", () => {
  const promises = [{ label: "Cash on delivery" }, { label: "7-day returns" }];

  it("lays promises out in a row unless told otherwise", () => {
    const { container } = render(<FooterPromises promises={promises} />);
    expect(container.querySelector(".sf-footer-trustbar")).toHaveAttribute("data-arrange", "row");
  });

  it("marks a column arrangement for the stacked grid", () => {
    const { container } = render(<FooterPromises promises={promises} arrange="column" />);
    expect(container.querySelector(".sf-footer-trustbar")).toHaveAttribute("data-arrange", "column");
  });
});
