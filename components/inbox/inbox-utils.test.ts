// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { attachmentKind, initialsOf } from "./inbox-utils";

describe("initialsOf", () => {
  it("takes the first letter of the first and last word", () => {
    expect(initialsOf("Rahim Uddin")).toBe("RU");
    expect(initialsOf("  sadia  akter khan ")).toBe("SK");
    expect(initialsOf("Karim")).toBe("K");
  });

  it("works for Bangla names and never returns an empty avatar", () => {
    expect(initialsOf("রহিম উদ্দিন")).toBe("রউ");
    expect(initialsOf("")).toBe("?");
    expect(initialsOf(undefined)).toBe("?");
  });
});

describe("attachmentKind", () => {
  it("names the types Meta sends, and folds the rest into other", () => {
    expect(attachmentKind("image")).toBe("image");
    expect(attachmentKind("audio")).toBe("audio");
    expect(attachmentKind("fallback")).toBe("other");
    expect(attachmentKind("sticker")).toBe("other");
  });
});
