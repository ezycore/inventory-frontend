// coding-standard: maintained
/**
 * Convert a monetary amount to words for the "amount in words" line on
 * invoices/receipts. English uses short-scale (Thousand / Million / Billion);
 * Bangla uses the lakh/crore grouping that matches `lib/format.ts`'s digit
 * convention (docs/I18N.md). Both render the fraction as Western-digit `NN/100`
 * — digits stay Western app-wide, only the words translate. Currency-agnostic —
 * the caller prefixes the currency name/code if desired.
 */
import type { AppLocale } from "@/i18n/config";

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];

const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty",
  "Ninety",
];

const SCALES = ["", "Thousand", "Million", "Billion", "Trillion"];

/** Words for 0–999 (no scale suffix). Empty string for 0. */
const threeDigitsToWords = (n: number): string => {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest > 0) {
    if (rest < 20) parts.push(ONES[rest]);
    else {
      const tens = TENS[Math.floor(rest / 10)];
      const ones = rest % 10;
      parts.push(ones > 0 ? `${tens} ${ONES[ones]}` : tens);
    }
  }
  return parts.join(" ");
};

/** Whole-number to words (short scale). */
const integerToWords = (value: number): string => {
  if (value === 0) return "Zero";
  const groups: string[] = [];
  let n = value;
  let scaleIndex = 0;
  while (n > 0 && scaleIndex < SCALES.length) {
    const group = n % 1000;
    if (group > 0) {
      const words = threeDigitsToWords(group);
      groups.unshift(scaleIndex > 0 ? `${words} ${SCALES[scaleIndex]}` : words);
    }
    n = Math.floor(n / 1000);
    scaleIndex += 1;
  }
  return groups.join(" ").trim() || "Zero";
};

/**
 * Amount to words (English), e.g. `840` → "Eight Hundred Forty Only",
 * `55.20` → "Fifty Five and 20 Only". Negative amounts are prefixed "Minus".
 *
 * **"Only" always terminates the phrase.** It used to live inside the paisa
 * branch, so a round amount — the commonest invoice total in a shop — printed
 * "Five Hundred " with a trailing space and no terminator, while `55.20` got
 * its "Only". That is the wrong half to lose: on a financial document "Only"
 * is a fraud control, the thing that stops digits being appended to the written
 * amount, which is exactly why cheques carry it.
 *
 * (This function's own docstring used to claim `840` → "Eight Hundred Forty and
 * 00/100" — the implementation never did that either. A zero fraction is now
 * omitted rather than written out, which is how an invoice actually reads.)
 */
const amountToWordsEn = (value: number): string => {
  if (!Number.isFinite(value)) return "";
  const sign = value < 0 ? "Minus " : "";
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const whole = Math.floor(rounded);
  const cents = Math.round((rounded - whole) * 100);
  const centStr = String(cents).padStart(2, "0");
  const fraction = centStr !== "00" ? ` and ${centStr}` : "";
  return `${sign}${integerToWords(whole)}${fraction} Only`;
};

// Bangla counting words 0–99 are irregular (not tens+ones compounds like
// English), so this is a full lookup table — the standard forms taught in
// Bengali-medium schools. REVIEW: worth a native-speaker proofread pass
// (docs/I18N-GLOSSARY.md REVIEW convention), same as the rest of the glossary.
const WORDS_BN_0_99 = [
  "শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়",
  "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ",
  "বিশ", "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আটাশ", "উনত্রিশ",
  "ত্রিশ", "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাঁইত্রিশ", "আটত্রিশ", "উনচল্লিশ",
  "চল্লিশ", "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছেচল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "উনপঞ্চাশ",
  "পঞ্চাশ", "একান্ন", "বায়ান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "উনষাট",
  "ষাট", "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছেষট্টি", "সাতষট্টি", "আটষট্টি", "ঊনসত্তর",
  "সত্তর", "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "ঊনআশি",
  "আশি", "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "আটাশি", "ঊননব্বই",
  "নব্বই", "একানব্বই", "বিরানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই",
];

/** Words for a whole number, lakh/crore grouped; ≥100 crore recurses on the crore count. */
const integerToWordsBn = (value: number): string => {
  if (value === 0) return "শূন্য";
  let n = value;
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rest = n % 100;

  const parts: string[] = [];
  if (crore > 0) {
    const croreWords = crore < 100 ? WORDS_BN_0_99[crore] : integerToWordsBn(crore);
    parts.push(`${croreWords} কোটি`);
  }
  if (lakh > 0) parts.push(`${WORDS_BN_0_99[lakh]} লক্ষ`);
  if (thousand > 0) parts.push(`${WORDS_BN_0_99[thousand]} হাজার`);
  if (hundred > 0) parts.push(`${WORDS_BN_0_99[hundred]} শত`);
  if (rest > 0) parts.push(WORDS_BN_0_99[rest]);
  return parts.join(" ");
};

/**
 * Amount to words (Bangla), mirroring `amountToWordsEn`'s shape/fraction rules —
 * including that **`মাত্র` always terminates the phrase**. It had the identical
 * bug: the terminator sat inside the paisa branch, so a round amount printed
 * "পাঁচ শত " with no `মাত্র` at all.
 */
const amountToWordsBn = (value: number): string => {
  if (!Number.isFinite(value)) return "";
  const sign = value < 0 ? "ঋণাত্মক " : "";
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const whole = Math.floor(rounded);
  const cents = Math.round((rounded - whole) * 100);
  const centStr = String(cents).padStart(2, "0");
  const fraction = centStr !== "00" ? ` এবং ${centStr}/100` : "";
  return `${sign}${integerToWordsBn(whole)}${fraction} মাত্র`;
};

/** Amount to words in the given locale (defaults to English). */
export const amountToWords = (value: number, locale: AppLocale = "en"): string =>
  locale === "bn" ? amountToWordsBn(value) : amountToWordsEn(value);
