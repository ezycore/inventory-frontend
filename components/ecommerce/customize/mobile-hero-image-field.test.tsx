// coding-standard: maintained

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileHeroImageField } from "@/components/ecommerce/customize/mobile-hero-image-field";
import { TooltipProvider } from "@/ui/components/tooltip";

const uploaded = {
  url: "/mobile.jpg",
  mediumUrl: "/mobile-medium.jpg",
  publicId: "storefront/mobile",
};

vi.mock("@/services/api", () => ({
  useUploadStorefrontImage: () => ({
    isPending: false,
    mutate: (
      _file: File,
      options: { onSuccess: (result: { data: typeof uploaded }) => void },
    ) => options.onSuccess({ data: uploaded }),
  }),
}));

describe("MobileHeroImageField", () => {
  it("hands replacement to the parent once so it can clear focal atomically", () => {
    const onImageReplace = vi.fn();
    const onFocalChange = vi.fn();
    const { container } = render(
      <TooltipProvider>
        <MobileHeroImageField
          desktopUrl="/desktop.jpg"
          onImageReplace={onImageReplace}
          onFocalChange={onFocalChange}
        />
      </TooltipProvider>,
    );

    fireEvent.change(container.querySelector("input[type=file]")!, {
      target: { files: [new File(["image"], "mobile.jpg", { type: "image/jpeg" })] },
    });

    expect(onImageReplace).toHaveBeenCalledOnce();
    expect(onImageReplace).toHaveBeenCalledWith(uploaded);
    expect(onFocalChange).not.toHaveBeenCalled();
  });

  it("removes the image through the same atomic parent callback", () => {
    const onImageReplace = vi.fn();
    const onFocalChange = vi.fn();
    render(
      <TooltipProvider>
        <MobileHeroImageField
          desktopUrl="/desktop.jpg"
          image={uploaded}
          onImageReplace={onImageReplace}
          onFocalChange={onFocalChange}
        />
      </TooltipProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove mobile image (optional)" }));

    expect(onImageReplace).toHaveBeenCalledWith(null);
    expect(onFocalChange).not.toHaveBeenCalled();
  });
});
