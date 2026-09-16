// coding-standard: maintained

/**
 * The attribute marking an order form on a builder page. The order form section
 * stamps it; the sticky order bar's button scrolls to the first element carrying
 * it, and hides while one is on screen.
 */
export const ORDER_FORM_ANCHOR = "data-sf-order-form";

export const ORDER_FORM_SELECTOR = `[${ORDER_FORM_ANCHOR}]`;

/**
 * The attribute marking the product page's own buy buttons. The sticky order bar
 * on a product page with no order form scrolls to it — not to the top, where a
 * phone shows the photos and the buttons are still below the fold.
 */
export const BUY_PANEL_ANCHOR = "data-sf-buy-panel";

export const BUY_PANEL_SELECTOR = `[${BUY_PANEL_ANCHOR}]`;
