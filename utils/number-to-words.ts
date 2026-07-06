// coding-standard: maintained
/**
 * Convert a monetary amount to English words for the "amount in words" line on
 * invoices. Short-scale (Thousand / Million / Billion), two-decimal fraction
 * rendered as `NN/100`. Currency-agnostic — the caller prefixes the currency
 * name/code if desired.
 */

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
 * Amount to words with a two-decimal fraction, e.g. `840` → "Eight Hundred Forty
 * and 00/100". Negative amounts are prefixed "Minus".
 */
export const amountToWords = (value: number): string => {
  if (!Number.isFinite(value)) return "";
  const sign = value < 0 ? "Minus " : "";
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const whole = Math.floor(rounded);
  const cents = Math.round((rounded - whole) * 100);
  const centStr = String(cents).padStart(2, "0");
  return `${sign}${integerToWords(whole)} ${centStr != "00" ? `and ${centStr} Only` : ""}`;
};
