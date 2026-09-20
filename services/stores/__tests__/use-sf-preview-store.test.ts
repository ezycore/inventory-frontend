// coding-standard: maintained

import { beforeEach, describe, expect, it } from "vitest";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";

/**
 * `apply` is a hand-written key-by-key merge, so a field can be declared in the
 * state, typed in the patch, given an initial value — and still never be
 * assigned, in which case the Customize editor streams it and the storefront
 * never sees it. That is exactly how the campaign strip's on/off switch moved
 * the live store but not the preview: every component test mocked this store,
 * so nothing ever exercised the merge itself.
 *
 * This walks the whole patch instead of naming one field, because the next
 * forgotten key would fail the same way and be just as invisible.
 */
describe("useSfPreview.apply", () => {
  const initial = useSfPreview.getState();

  beforeEach(() => {
    useSfPreview.setState(initial, true);
  });

  it("applies the campaign strip so the preview follows the draft switch", () => {
    useSfPreview
      .getState()
      .apply({ campaignStrip: { enabled: false, showOn: "home" } });

    expect(useSfPreview.getState().campaignStrip).toEqual({
      enabled: false,
      showOn: "home",
    });
  });

  it("assigns every drafted field it is handed", () => {
    /* One recognisable value per key. The values are nonsense to the components
       that read them — the assertion is only that the merge did not drop the
       key on the floor. */
    const patch = Object.fromEntries(
      Object.keys(initial)
        .filter((k) => !["active", "apply", "activate"].includes(k))
        .map((k) => [k, `sent-${k}`]),
    );

    useSfPreview.getState().apply(patch as never);

    const after = useSfPreview.getState() as unknown as Record<string, unknown>;
    const dropped = Object.keys(patch).filter((k) => after[k] !== `sent-${k}`);
    expect(dropped).toEqual([]);
  });

  it("leaves a field alone when the patch omits it", () => {
    useSfPreview.getState().apply({ brand: "#111111" });
    useSfPreview.getState().apply({ accent: "#222222" });

    expect(useSfPreview.getState().brand).toBe("#111111");
  });
});
