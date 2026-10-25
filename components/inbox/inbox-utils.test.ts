// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { attachmentKind, initialsOf, readOAuthReturn } from "./inbox-utils";

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

describe("readOAuthReturn", () => {
  it("returns the grant exactly as the backend encoded it (colons included)", () => {
    const grant = "v1:abc123:def456:0011ff";
    const hash = `#${new URLSearchParams({ oauth: grant }).toString()}`;
    expect(readOAuthReturn(hash)).toEqual({ grant });
  });

  it("names a known error and folds anything else into `failed`", () => {
    expect(readOAuthReturn("#oauthError=cancelled")).toEqual({ error: "cancelled" });
    expect(readOAuthReturn("#oauthError=INBOX_OAUTH_SESSION_INVALID")).toEqual({
      error: "INBOX_OAUTH_SESSION_INVALID",
    });
    expect(readOAuthReturn("#oauthError=SOMETHING_NEW")).toEqual({ error: "failed" });
  });

  it("ignores an ordinary visit", () => {
    expect(readOAuthReturn("")).toBeNull();
    expect(readOAuthReturn("#section")).toBeNull();
  });
});
