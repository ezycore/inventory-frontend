// coding-standard: maintained

import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NumberField } from "./number-field";

/**
 * The shared numeric input, used by ~43 fields and until now untested — which is
 * where QA-R14 lived: a transfer typed as 3.7 was added as 4, and a return typed
 * as 2.5 refunded 3 units. Both moved more stock and more money than the merchant
 * asked for, silently.
 *
 * The rules these tests pin down:
 * - `precision={0}` means whole units and TRUNCATES; it never rounds up.
 * - clamping happens on blur, not on every keystroke, so a value can be typed
 *   through intermediate states — parents that show a live total clamp for
 *   themselves (both the return row and the receive dialog do).
 */
function Harness({
  precision,
  min,
  max,
  onValue,
}: {
  precision?: number;
  min?: number;
  max?: number;
  onValue?: (n: number | null) => void;
}) {
  const [value, setValue] = useState<number | null>(0);
  return (
    <>
      <NumberField
        aria-label="qty"
        precision={precision}
        min={min}
        max={max}
        value={value}
        onChange={(v) => {
          setValue(v);
          onValue?.(v);
        }}
      />
      <button type="button">elsewhere</button>
    </>
  );
}

const field = () => screen.getByLabelText("qty");
const type = async (user: ReturnType<typeof userEvent.setup>, text: string) => {
  await user.clear(field());
  await user.type(field(), text);
};

describe("NumberField — whole units", () => {
  it("truncates a fractional entry instead of rounding it up", async () => {
    const onValue = vi.fn();
    const user = userEvent.setup();
    render(<Harness precision={0} min={0} onValue={onValue} />);

    await type(user, "3.7");

    // 4 would transfer a unit the merchant never typed.
    expect(onValue).toHaveBeenLastCalledWith(3);
  });

  it("truncates the .5 case downward too", async () => {
    const onValue = vi.fn();
    const user = userEvent.setup();
    render(<Harness precision={0} min={0} onValue={onValue} />);

    await type(user, "2.5");

    // `toFixed(0)` rounded this to 3, refunding a unit that never came back.
    expect(onValue).toHaveBeenLastCalledWith(2);
  });

  it("settles a sub-unit entry at zero", async () => {
    const user = userEvent.setup();
    render(<Harness precision={0} min={0} />);

    await type(user, "0.4");
    await user.click(screen.getByRole("button", { name: "elsewhere" }));

    expect(field()).toHaveValue("0");
  });
});

describe("NumberField — bounds", () => {
  it("clamps to max on blur", async () => {
    const user = userEvent.setup();
    render(<Harness precision={0} min={0} max={17} />);

    await type(user, "99");
    await user.click(screen.getByRole("button", { name: "elsewhere" }));

    expect(field()).toHaveValue("17");
  });

  it("clamps up to min on blur", async () => {
    const user = userEvent.setup();
    render(<Harness precision={0} min={5} max={17} />);

    await type(user, "1");
    await user.click(screen.getByRole("button", { name: "elsewhere" }));

    expect(field()).toHaveValue("5");
  });

  it("does not clamp mid-keystroke, so a longer number can still be typed", async () => {
    // Clamping on every keystroke would pin the field at `min` the moment the
    // first digit fell below it, making 15 unreachable in a field with min 5.
    const user = userEvent.setup();
    render(<Harness precision={0} min={5} max={100} />);

    await type(user, "15");

    expect(field()).toHaveValue("15");
  });
});

describe("NumberField — money", () => {
  it("keeps two decimals when precision says so", async () => {
    const onValue = vi.fn();
    const user = userEvent.setup();
    render(<Harness precision={2} min={0} onValue={onValue} />);

    await type(user, "12.349");

    expect(onValue).toHaveBeenLastCalledWith(12.35);
  });

  it("rejects letters rather than blanking the field", async () => {
    const user = userEvent.setup();
    render(<Harness precision={0} min={0} />);

    await type(user, "12");
    await user.type(field(), "abc");

    expect(field()).toHaveValue("12");
  });
});
