// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { parseBdAddress } from "./parse-bd-address";

/**
 * A table of the blobs BD buyers actually send.
 *
 * The parser is a **prefill**, so a miss costs the merchant one field of typing.
 * A confidently wrong district costs a misrouted parcel and a mispriced
 * delivery, so the partial-failure rows below are as load-bearing as the happy
 * ones: they pin that the parser leaves a field blank rather than guessing.
 */
describe("parseBdAddress", () => {
  it("parses the canonical three-line Bangla blob", () => {
    const parsed = parseBdAddress(
      ["রহিম উদ্দিন", "01712345678", "বাসা ১২, রোড ৪, ধানমন্ডি, ঢাকা"].join("\n"),
    );
    expect(parsed.name).toBe("রহিম উদ্দিন");
    expect(parsed.phone).toBe("01712345678");
    expect(parsed.district).toBe("Dhaka");
    expect(parsed.area).toBe("Dhanmondi");
    expect(parsed.address).toContain("বাসা ১২");
  });

  it("parses the English equivalent", () => {
    const parsed = parseBdAddress(
      ["Rahim Uddin", "01712345678", "House 12, Road 4, Dhanmondi, Dhaka"].join("\n"),
    );
    expect(parsed).toMatchObject({
      name: "Rahim Uddin",
      phone: "01712345678",
      district: "Dhaka",
      area: "Dhanmondi",
    });
  });

  it.each([
    ["+880 1712-345678", "01712345678"],
    ["৪১৭১২৩৪৫৬৭৮".replace("৪", "০"), "01712345678"],
    ["8801712345678", "01712345678"],
    ["01712 345678", "01712345678"],
  ])("normalises the phone written as %s", (written, expected) => {
    // One definition of a valid BD mobile in the codebase — the parser defers to
    // `normalizeBdPhone`, the same function the checkout and the server use.
    expect(parseBdAddress(`Karim\n${written}\nGulshan, Dhaka`).phone).toBe(expected);
  });

  it("takes the LAST district mention, since BD addresses run narrow to wide", () => {
    // "Comilla" names both a district and a town inside it. The trailing one is
    // the district; an earlier one is the area.
    const parsed = parseBdAddress("Nasir\n01812345678\nHouse 3, Comilla Sadar, Comilla");
    expect(parsed.district).toBe("Comilla");
  });

  it("finds the area only within the matched district", () => {
    const parsed = parseBdAddress("Sultana\n01912345678\nKotwali, Chattogram");
    expect(parsed.district).toBe("Chattogram");
    // Several districts have a "Kotwali"; only Chattogram's may be picked here.
    expect(parsed.area).toBe("Kotwali");
  });

  it("keeps the street when the phone shares its line", () => {
    const parsed = parseBdAddress("Jamal\n01712345678, House 9, Banani, Dhaka");
    expect(parsed.phone).toBe("01712345678");
    // Dropping the whole line would have thrown the address away with the phone.
    expect(parsed.address).toContain("House 9");
    expect(parsed.district).toBe("Dhaka");
  });

  it("survives a postcode hanging off the district", () => {
    const parsed = parseBdAddress("Ayesha\n01612345678\nMirpur, Dhaka-1216");
    expect(parsed.district).toBe("Dhaka");
    expect(parsed.area).toBe("Mirpur");
  });

  it("tolerates the spellings of Cox's Bazar", () => {
    // The dataset stores "Coxsbazar" — one word, no apostrophe — and the parser
    // must return THAT, because it is the value the district picker matches on.
    // A human writes it three other ways.
    for (const written of ["Cox's Bazar", "Coxs Bazar", "cox's bazar", "Coxsbazar"]) {
      expect(parseBdAddress(`Rina\n01512345678\n${written}`).district).toBe(
        "Coxsbazar",
      );
    }
  });

  it("handles a single-line blob with no newlines", () => {
    const parsed = parseBdAddress("Tanvir, 01712345678, Uttara, Dhaka");
    expect(parsed.phone).toBe("01712345678");
    expect(parsed.district).toBe("Dhaka");
    expect(parsed.area).toBe("Uttara");
  });

  // ── the partial failures, which matter as much as the successes ───────────

  it("leaves the district blank rather than guessing", () => {
    const parsed = parseBdAddress("Rahim Uddin\n01712345678\nnear the big mosque");
    expect(parsed.phone).toBe("01712345678");
    expect(parsed.name).toBe("Rahim Uddin");
    // A wrong district misroutes the parcel and misprices delivery. Empty is the
    // cheaper failure — the merchant fills one field in.
    expect(parsed.district).toBeUndefined();
    expect(parsed.area).toBeUndefined();
  });

  it("leaves the phone blank when the number is not a BD mobile", () => {
    const parsed = parseBdAddress("Rahim\n+1 415 555 2671\nDhanmondi, Dhaka");
    expect(parsed.phone).toBeUndefined();
    // …and still parses everything else it can.
    expect(parsed.district).toBe("Dhaka");
  });

  it("leaves the area blank when only the district is recognisable", () => {
    const parsed = parseBdAddress("Karim\n01712345678\nsomewhere off the main road, Sylhet");
    expect(parsed.district).toBe("Sylhet");
    expect(parsed.area).toBeUndefined();
  });

  it("never returns a place name as the person's name", () => {
    const parsed = parseBdAddress("01712345678\nDhanmondi\nDhaka");
    expect(parsed.name).toBeUndefined();
    expect(parsed.district).toBe("Dhaka");
  });

  it("returns nothing for empty or junk input", () => {
    expect(parseBdAddress("")).toEqual({});
    expect(parseBdAddress("   \n  ")).toEqual({});
    const junk = parseBdAddress("???");
    expect(junk.phone).toBeUndefined();
    expect(junk.district).toBeUndefined();
  });

  it("does not match a district hidden inside a longer word", () => {
    // Word-bounded matching: "Bhola" sits inside other strings, and a substring
    // match would confidently set the wrong district.
    expect(parseBdAddress("Shafiq\n01712345678\nBholanath Road").district).toBeUndefined();
  });
});
