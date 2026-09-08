/**
 * The frontend's zone inference.
 *
 * This is a hand-kept port of the backend's `src/utils/bd-zone.ts`, and the
 * backend is authoritative — it re-derives the zone at `placeOrder` and its
 * answer is what the shopper is charged. A drift between the two therefore shows
 * up as the total changing at the last step, which is why these cases mirror the
 * backend's own test file one for one. If you change one, change both.
 */
import { describe, expect, it } from "vitest";
import { inferZone } from "@/lib/bd-zone";

describe("inferZone", () => {
  it("reads the district off a normally written address", () => {
    expect(inferZone("House 12, Road 5, Dhanmondi, Dhaka")).toMatchObject({
      zone: "inside",
      confidence: "high",
      district: "Dhaka",
    });
  });

  /** "Dhaka" names a road here; "Tangail" names the destination. */
  it("does not read a road name as the destination", () => {
    expect(inferZone("Dhaka Road, Tangail")).toMatchObject({
      zone: "outside",
      confidence: "high",
      district: "Tangail",
    });
  });

  it("recognises metro thanas the government upazila list omits", () => {
    for (const area of ["Banani", "Uttara Sector 7", "Gulshan 2", "Dhanmondi 27"]) {
      expect(inferZone(area)).toMatchObject({ zone: "inside", confidence: "high" });
    }
  });

  it("still resolves Dhaka's rural upazilas", () => {
    expect(inferZone("Savar, Dhaka")).toMatchObject({ zone: "inside", confidence: "high" });
  });

  /** Both name a Dhaka thana AND an upazila elsewhere — a coin flip on money. */
  it("refuses to decide on a name two districts claim", () => {
    expect(inferZone("Mirpur 10, Block C").confidence).toBe("ambiguous");
    expect(inferZone("Mohammadpur, House 4").confidence).toBe("ambiguous");
  });

  it("asks rather than guesses when the address names no place", () => {
    expect(inferZone("House 4, Block C, Road 2")).toMatchObject({
      zone: "outside",
      confidence: "ambiguous",
    });
    expect(inferZone("").confidence).toBe("ambiguous");
    expect(inferZone(undefined).confidence).toBe("ambiguous");
  });

  it("resolves Bangla addresses with their combining marks intact", () => {
    const bn = inferZone("বাসা ১২, ধানমন্ডি, ঢাকা");
    expect(bn).toMatchObject({ zone: "inside", confidence: "high" });
    // Not "ঢ ক" — Bangla vowel signs are marks, not letters.
    expect(bn.matched).toBe("ঢাকা");
    expect(inferZone("ঢাকা রোড, টাঙ্গাইল").zone).toBe("outside");
  });

  it("is unfazed by punctuation and casing", () => {
    expect(inferZone("house-12/A, road#5, DHAKA.")).toMatchObject({
      zone: "inside",
      confidence: "high",
    });
  });

  it("matches whole words only", () => {
    // A real place in Sylhet; it must not read as "Dhaka".
    expect(inferZone("Dhakadakshin Bazar").zone).toBe("outside");
  });
});
