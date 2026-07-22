# Bangla Translation Glossary

Single source of truth for domain terminology. Every translated string containing one of these terms MUST use the form defined here. Change a term here first, then sweep the message files.

**Status: DRAFT — needs native-speaker review before Phase 3 begins.**

## Conventions

**Guiding principle: familiarity over literal translation.** Many English terms (or their
transliterations) are what Bangladeshi users actually say — Batch, Ledger, Report, Settings,
Stock. Forcing pure-Bangla literalism reduces usability. When a REVIEW row is settled, the
question is "what would a shopkeeper call this?", not "what is the correct Bangla word?".

- **Translate** — use the Bangla word; it is common in BD retail/business speech.
- **Transliterate** — write the English word in Bangla script (ব্যাচ, ব্র্যান্ড); the English term is what shopkeepers actually say.
- **Keep English** — leave in Latin script (rare; e.g. SKU-like codes, "VAT" on receipts is fine either way).
- When two forms are listed, the first is the app-wide choice; the second is noted for context only.
- Digits stay Western (0-9) with lakh/crore grouping (১,২৩,৪৫৬ style grouping but Western digits: 1,23,456). Currency symbol: ৳.

## Core domain terms

| English | Bangla | Decision | Notes |
|---|---|---|---|
| Product | পণ্য | translate | universal |
| Inventory | ইনভেন্টরি | transliterate | মজুদ is formal but reads as "stock" |
| Stock | স্টক | transliterate | universally understood |
| Opening Stock | প্রারম্ভিক স্টক | mixed | |
| Low Stock | স্টক কম | mixed | |
| Out of Stock | স্টক নেই | mixed | |
| Purchase | ক্রয় | translate | standard accounting term |
| Sale / Sell | বিক্রয় | translate | বিক্রি in casual UI copy is fine |
| Return | ফেরত | translate | goods return |
| Supplier | সরবরাহকারী | translate | সাপ্লায়ার acceptable alt — REVIEW |
| Customer | গ্রাহক | translate | কাস্টমার acceptable alt — REVIEW |
| Batch | ব্যাচ | transliterate | no natural Bangla equivalent in trade use |
| Expiry / Expiry Date | মেয়াদ / মেয়াদ শেষের তারিখ | translate | |
| Expired | মেয়াদোত্তীর্ণ | translate | |
| Ledger | খতিয়ান | translate | traditional BD bookkeeping term; লেজার alt — REVIEW |
| Adjustment (stock) | সমন্বয় | translate | accounting standard; অ্যাডজাস্টমেন্ট alt — REVIEW |
| Transfer (stock) | স্থানান্তর | translate | ট্রান্সফার alt |
| Category | ক্যাটাগরি | transliterate | শ্রেণী reads academic |
| Brand | ব্র্যান্ড | transliterate | |
| Unit (of measure) | একক | translate | ইউনিট alt — REVIEW |
| Variant | ভ্যারিয়েন্ট | transliterate | |
| Combo | কম্বো | transliterate | |
| Barcode | বারকোড | transliterate | |
| Location | লোকেশন | transliterate | শাখা (branch) only if UI means branch — REVIEW |
| Warehouse | গুদাম | translate | if ever used |

## Money & accounting

| English | Bangla | Decision | Notes |
|---|---|---|---|
| Price | মূল্য | translate | দাম in casual copy |
| Cost Price | ক্রয়মূল্য | translate | |
| Selling Price | বিক্রয়মূল্য | translate | |
| Quantity | পরিমাণ | translate | |
| Amount (money) | টাকার অঙ্ক | translate | CONFLICT with Quantity=পরিমাণ — never use পরিমাণ for money. REVIEW |
| Total | মোট | translate | |
| Subtotal | সাবটোটাল | transliterate | no clean Bangla; মোট reserved for Total — REVIEW |
| Grand Total | সর্বমোট | translate | |
| Discount | ছাড় | translate | very common in retail; ডিসকাউন্ট alt |
| Tax | কর | translate | VAT stays ভ্যাট |
| Tax (in price) | মূল্যসহ কর | translate | inclusive tax |
| Tax (added) | অতিরিক্ত কর | translate | REVIEW — exclusive tax phrasing |
| Invoice | চালান | translate | standard BD trade term (chalan) |
| Receipt | রসিদ | translate | |
| Payment | পেমেন্ট | transliterate | পরিশোধ formal alt |
| Paid | পরিশোধিত | translate | |
| Due | বাকি | translate | retail-universal; বকেয়া formal alt — REVIEW |
| Partial | আংশিক | translate | |
| Balance | ব্যালেন্স | transliterate | জের is bookkeeper jargon |
| Refund / Refunded | রিফান্ড / রিফান্ড হয়েছে | transliterate | ফেরত reserved for goods return |
| Cash | নগদ | translate | |
| Account | অ্যাকাউন্ট | transliterate | হিসাব alt — REVIEW |
| Amount in words | কথায় | translate | receipts: "টাকা কথায়:" |

## Online store (ecommerce)

The storefront module names its screens "Store X" so they never collide with the counter-side
screen of the same name — a shop owner has both an online and an in-person customer list, and the
sidebar must say which one it is opening.

| English | Bangla | Decision | Notes |
|---|---|---|---|
| Online Store | অনলাইন স্টোর | transliterate | what BD shopkeepers say; ই-কমার্স only for the plan/feature name |
| Store Overview | স্টোর ওভারভিউ | transliterate | the storefront's own dashboard — never plain "Dashboard" |
| Order (online) | অর্ডার | transliterate | matches Ordered = অর্ডারকৃত |
| Online Orders | অনলাইন অর্ডার | mixed | distinct from Purchase Orders = ক্রয় অর্ডার |
| Store Customers | স্টোর গ্রাহক | mixed | storefront shoppers, not counter Customers = গ্রাহক |
| Catalog | ক্যাটালগ | transliterate | which products are listed online |
| Campaign | ক্যাম্পেইন | transliterate | |
| Coupon | কুপন | transliterate | |
| Customize | কাস্টমাইজ | transliterate | storefront theme editor |
| Content | কনটেন্ট | transliterate | CMS pages |
| Courier | কুরিয়ার | transliterate | Pathao / Steadfast / eCourier |
| Cash on Delivery (COD) | ক্যাশ অন ডেলিভারি | transliterate | universally said in full or as "COD" |

## Statuses

| English | Bangla |
|---|---|
| Status | স্ট্যাটাস |
| Active | সক্রিয় |
| Inactive | নিষ্ক্রিয় |
| Pending | অপেক্ষমাণ |
| Draft | খসড়া |
| Ordered | অর্ডারকৃত |
| Received | গৃহীত |
| Processed | প্রক্রিয়াকৃত |
| Cancelled | বাতিল |
| Default | ডিফল্ট |

## App chrome & actions

| English | Bangla | Notes |
|---|---|---|
| Save | সংরক্ষণ | সেভ acceptable — REVIEW |
| Cancel | বাতিল | same word as Cancelled status — OK in Bangla |
| Delete | মুছুন | |
| Edit | সম্পাদনা | এডিট alt — REVIEW |
| Close | বন্ধ | |
| Search | খুঁজুন | |
| View Details | বিস্তারিত দেখুন | |
| No data available | কোনো তথ্য নেই | |
| Loading… | লোড হচ্ছে… | |
| Settings | সেটিংস | |
| Dashboard | ড্যাশবোর্ড | |
| Report | রিপোর্ট | |
| Billing | বিলিং | |
| Organization / Workspace | প্রতিষ্ঠান | REVIEW — ওয়ার্কস্পেস alt |
| User | ব্যবহারকারী | ইউজার alt — REVIEW |
| Role | রোল | ভূমিকা reads odd in software |
| Permission | পারমিশন | অনুমতি alt — REVIEW |
| Email | ইমেইল | |
| Phone | ফোন | |
| Name | নাম | |
| Address | ঠিকানা | |
| Notes | নোট | |
| Description | বিবরণ | |
| Date | তারিখ | |
| Today | আজ | |
| Reason | কারণ | |

## Rules

1. **REVIEW-tagged rows** = judgment calls; native reviewer decides once, before Phase 3.
2. Never invent a new translation for a glossary term inside a message file — extend the glossary instead.
3. Same English word, different meaning → different Bangla (Return goods=ফেরত vs Refund money=রিফান্ড; Amount=টাকার অঙ্ক vs Quantity=পরিমাণ). When adding terms, check for collisions in the Bangla column.
4. Product names, customer names, user-typed content: never translated.
5. Receipt/document strings may later use a separate org-level document language; glossary applies there too.
