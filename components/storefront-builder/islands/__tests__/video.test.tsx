// coding-standard: maintained
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VideoIsland } from "@/components/storefront-builder/islands/video";

describe("VideoIsland", () => {
  it("shows only a cover until pressed, then loads the provider's player", () => {
    const { container } = render(
      <VideoIsland
        embed={{ provider: "youtube", id: "dQw4w9WgXcQ" }}
        label="How to wear it"
        poster="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
        ratio="16 / 9"
      />,
    );
    expect(container.querySelector("iframe")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "How to wear it" }));
    const player = container.querySelector("iframe") as HTMLIFrameElement;
    expect(player.src).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0");
    expect(player.title).toBe("How to wear it");
  });
});
