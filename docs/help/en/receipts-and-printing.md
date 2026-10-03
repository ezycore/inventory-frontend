---
title: Set up your receipts and invoices
slug: receipts-and-printing
summary: Control the letterhead printed on every invoice, receipt, purchase order and return.
order: 78
covers_routes:
  - /settings/receipt
features:
  - invoicePrinting
ui_labels:
  - settings:receipt.title
  - settings:receipt.subtitle
  - settings:receipt.letterheadTitle
  - settings:receipt.previewTitle
  - settings:receipt.taxIdLabel
  - settings:receipt.paperSizeLabel
  - settings:receipt.watermarkHint
  - settings:receipt.addCustomLine
  - settings:receipt.showAmountInWords
  - settings:receipt.footerTitle
  - settings:receipt.resetDefaults
  - settings:receipt.logoHeightLabel
  - settings:receipt.v2.itemColumns.title
  - settings:receipt.v2.totals.title
  - settings:receipt.v2.signature.title
  - settings:receipt.v2.payment.title
  - settings:receipt.v2.qr.title
  - settings:receipt.v2.copies.title
---

# Set up your receipts and invoices

**Receipt & Print** controls *The letterhead printed on every invoice, receipt, purchase order and
return.* One setup covers every printed document, so you configure it once rather than per document
type.

Worth doing in your first week — every receipt you hand out before this is set up is a receipt with
someone else's idea of your business on it.

## Letterhead

**Letterhead** is what prints at the top. You *Compose what prints at the top of every document —
reorder lines, hide what you don't need, and add your own.*

The available lines are your business name, VAT registration number (BIN), store or branch, address, and
phone/email. Reorder them with the arrows, hide any with its switch, and use **Add custom line** for
anything else you need — a licence number, a slogan, a second phone.

Where each line's content comes from matters when you want to change it:

| Line | Edited where |
|---|---|
| Business name, Address, Logo | Organization profile |
| Store / branch | Your active location |
| VAT Reg. No., Phone, Email | This page |
| Custom lines | This page |

So if your business name prints wrong, this is not the page to fix it — see
[Set up your shop](./set-up-your-shop.md).

**VAT Registration No. (BIN)** prints in the letterhead. Leave it blank to hide it
entirely rather than printing an empty label.

## Logo

Choose where the logo prints: top of the header, as a watermark, both, or hidden.

One limit worth knowing before you design around it: *Watermark prints on A4 only — thermal receipts
can't render it.* If you print counter receipts on a thermal roll, the watermark will simply not
appear, and that is not a fault.

**Logo size** sets the logo's **Height (mm)** and **Width (mm)** for the paper shown in the preview —
each paper keeps its own size, since a full-page logo and a receipt logo are different things. The
logo always fits inside that box without stretching; the link icon between the fields keeps the
proportions as you type. **Use default size** goes back to the built-in size for that paper.

With the watermark on, you can also set its width and height (as a % of the page) and whether it sits
in the center, top or bottom.

Your logo is uploaded on the Organization profile, not here. If none is uploaded, this page tells you
so.

## Paper size

**Default paper size** picks between A4, 80mm thermal and 58mm thermal. It is only a default —
still overridable per print — so set it to whatever your counter uses most and override for the rare
full-page invoice.

## Extras

**Show amount in words** spells the total out under the totals, with a caption you choose (the
default is "In words:"). Many businesses need this on formal invoices.

**Footer note** prints at the bottom of every document — the natural home for your returns policy or
a thank-you line.

## Item table and totals (Body tab)

**Item table** adds columns: a serial number, the unit next to the quantity ("2 pcs"), the product
code, the line discount and, when you charge VAT, the line VAT. Receipts are narrow, so the code moves
under the product name and the 58mm slip drops the discount and VAT columns.

The unit and code are saved on each sale at the moment it's made, so a reprint next year matches the
original. Sales made before this update print those cells empty — the page never fills them in from
today's product.

**Totals** can show each payment method, the customer's **Previous due** ("Previous due · This
invoice · Total due"), and **Cash received and change** when the customer handed over more than the
bill. These need the Accounts feature.

## Signature, payment details, terms and QR (Footer tab)

**Signature and stamp** sets the left and right signature lines on A4 documents. You can upload a
signature image and your company stamp; they save as soon as you upload them. Only people who can edit
this page can change them, but anyone who can print can reprint them.

**Payment details** prints your bank accounts and bKash / Nagad / Rocket numbers for customers who pay
later. This is printed text only — it isn't linked to your accounts. Receipts show the wallets only.

**Terms and conditions** print in small type above the footer, on A4 only.

**QR code** can point to your online store or any link you choose, such as your Facebook page.

## Per-document settings (Documents tab)

Pick a document in the preview, then give it its own title (say "Cash Memo"), footer, terms, signature
lines, or hide the payment details or QR on it. Anything you leave as "Same as all documents" follows
the other tabs. Purchase orders and returns hide your payment details by default.

## Receipt printer, copies and the POS counter (Paper tab)

For 80mm and 58mm receipts you can make the text smaller or larger and change the side margin.
**Copies** prints up to three copies in one go, each labelled (Customer Copy, Shop Copy, Office Copy —
rename them if you like). On the full-screen POS you can open the print dialog after every sale.
Browsers can't print without asking, so the cashier still confirms the dialog; cutting the paper and
opening the cash drawer need a printer app and aren't possible from the browser.

## Live preview

**Live preview** shows *A sample invoice rendered exactly as it will print at the selected paper
size.* The A4 / 80 mm / 58 mm switch above it changes only the preview, not your default paper,
so you can check every paper you print on. Checking the preview at your
real paper size is faster than discovering the problem on a customer's receipt.

**Reset to defaults** puts the layout back to how it started. Your phone, email, VAT number and
footer text stay, and nothing changes until you click **Save changes**.

## If this page is unavailable

Two reasons: **Invoice Printing** is not enabled for your organization, or your role lacks
permission. See [Set up your shop](./set-up-your-shop.md) and
[Invite your team](./invite-your-team.md).
