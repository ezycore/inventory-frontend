// coding-standard: maintained
import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import bnLayout from "@/messages/bn/layout.json";
import type { MerchantAlert } from "@/services/api";
import { useAlertText } from "./use-alert-text";

/**
 * The bell's sentence in Bangla. "{name}-এর" cannot take a stand-in noun, so a handover that
 * arrives before Facebook sent the customer's name must use its own whole sentence — never
 * "একজন গ্রাহক-এর", and never the English "A customer" the email uses.
 */
const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="bn" messages={{ layout: bnLayout }}>
    {children}
  </NextIntlClientProvider>
);

const handover = (data: Record<string, string>): MerchantAlert => ({
  _id: "6add6a9e0cbaf7591fc9de41",
  eventKey: "inbox.handover",
  data,
  link: { kind: "chat", id: "6add6a9e0cbaf7591fc9de38" },
  createdAt: "2026-10-25T07:31:22.121Z",
  read: false,
});

describe("useAlertText (Bangla)", () => {
  it("names the customer when Facebook has sent the name", () => {
    const { result } = renderHook(() => useAlertText(), { wrapper });
    expect(result.current(handover({ customer_name: "করিম", reason: "ছবি পাঠিয়েছেন" }))).toEqual({
      title: "করিম-এর মেসেজের উত্তর বাকি",
      body: "ছবি পাঠিয়েছেন",
    });
  });

  it("uses a whole sentence when the name is not known yet", () => {
    const { result } = renderHook(() => useAlertText(), { wrapper });
    expect(result.current(handover({ reason: "ছবি পাঠিয়েছেন" })).title).toBe("একজন গ্রাহকের মেসেজের উত্তর বাকি");
  });
});
