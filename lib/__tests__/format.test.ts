// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { formatBytes } from "@/lib/format";

/**
 * The byte formatter behind the billing storage meter (and the file-upload
 * item's size line, which used to carry its own copy of this).
 *
 * The meter is the only place in the app where a merchant sees the figure a
 * quota is enforced against, so the rounding has to be defensible: a plan
 * ceiling must read as the number they bought, and a real measurement must not
 * round away the digit that distinguishes "nearly full" from "half empty".
 */
describe("formatBytes", () => {
  const KB = 1024;
  const MB = 1024 ** 2;
  const GB = 1024 ** 3;

  it("scales to the largest unit that leaves a whole part", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2 * KB)).toBe("2 KB");
    expect(formatBytes(2 * MB)).toBe("2 MB");
    expect(formatBytes(2 * GB)).toBe("2 GB");
  });

  it("drops a trailing .0 so a plan ceiling reads as the number bought", () => {
    // "Your plan includes 2.0 GB" is not what the pricing page says.
    expect(formatBytes(2 * GB)).not.toContain(".");
  });

  it("keeps one decimal on a real measurement", () => {
    // Rounding 1.6 MB to "2 MB" would overstate usage by a quarter, and the
    // meter is read against a cap.
    expect(formatBytes(1.6 * MB)).toBe("1.6 MB");
    expect(formatBytes(223516)).toBe("218.3 KB");
  });

  it("reports whole bytes, since there is no half a byte", () => {
    expect(formatBytes(1)).toBe("1 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  it("treats zero and nothing-at-all as empty", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-1)).toBe("0 B");
    expect(formatBytes(NaN)).toBe("0 B");
  });

  it("clamps the unit instead of running off the end of the table", () => {
    // The version this replaced indexed the unit array raw, so anything past a
    // petabyte rendered "1.0 undefined".
    expect(formatBytes(1024 ** 5)).toBe("1024 TB");
    expect(formatBytes(1024 ** 8)).not.toContain("undefined");
  });
});
