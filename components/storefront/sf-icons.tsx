import type { CSSProperties } from "react";

/**
 * Storefront icon set — exact SVG paths from the Rashid's Mart design so the
 * look matches 1:1 (and stays independent of the admin's lucide usage). Stroke
 * icons inherit `currentColor`; a couple are filled (star, dot).
 */
const PATHS: Record<string, string> = {
  cart: '<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2.5 3.5h2.2l2.2 11.2a1.1 1.1 0 0 0 1.1.9h8.7a1.1 1.1 0 0 0 1.1-.85L20.5 7H6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  phone: '<path d="M6.5 3.5h3l1.4 4-1.8 1.2a12 12 0 0 0 5.2 5.2l1.2-1.8 4 1.4v3a1.6 1.6 0 0 1-1.7 1.6A16.5 16.5 0 0 1 5 5.2 1.6 1.6 0 0 1 6.5 3.5Z"/>',
  check: '<path d="M4 12.5 9 17.5 20 6.5"/>',
  truck: '<path d="M2.5 6.5h10v9h-10z"/><path d="M12.5 9.5h4l3 3v3h-7z"/><circle cx="6" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
  shield: '<path d="M12 3 5 6v5c0 4.2 3 7.4 7 9 4-1.6 7-4.8 7-9V6l-7-3Z"/>',
  tag: '<path d="M3.5 11.5 11 4h7v7l-7.5 7.5a2 2 0 0 1-2.8 0l-4.2-4.2a2 2 0 0 1 0-2.8Z"/><circle cx="14.5" cy="7.5" r="1.2"/>',
  back: '<path d="M14 6 8 12l6 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  dot: '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>',
  bank: '<path d="M4 9.5 12 4l8 5.5"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8"/><path d="M3.5 20.5h17"/>',
  coins: '<ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/><path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  box: '<path d="M12 3 20 7v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4"/><path d="M12 11v10"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 9.5h18"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>',
  chevR: '<path d="M9 6l6 6-6 6"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="currentColor" stroke="none"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  mapPin: '<path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
  filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  sliders: '<path d="M4 8h10M18 8h2M4 16h2M10 16h10"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PATHS[name] }}
    />
  );
}
