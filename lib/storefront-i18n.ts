/**
 * Storefront i18n — English + Bangla strings, ported from the Rashid's Mart
 * design. The storefront is bilingual (BD traffic): a header toggle switches
 * `lang` (persisted in localStorage) and every component reads copy via the `t`
 * dictionary from `useStorefrontUI()`.
 */

export type Lang = "en" | "bn";

export interface Dict {
  langTag: string;
  langCode: string;
  langLabel: string;
  searchPh: string;
  /** Header search typeahead: recents section heading + category-chips heading. */
  recentSearches: string;
  categoriesLabel: string;
  account: string;
  cart: string;
  addToCart: string;
  viewAll: string;
  added: string;
  /** Price prefix on variable-product cards: "From ৳400". */
  fromPrice: string;
  /** Card CTA for variable products — options are picked on the PDP. */
  selectOptions: string;
  /** Quick-buy sheet: escape hatch to the full product page. */
  fullDetails: string;
  /** Quick-buy prompt while the shopper still owes an option choice. */
  chooseOption: string;
  /** Drawer link to the full /cart page. */
  viewCart: string;
  /** Campaign strip: "«name» — 10% off · Ends 4 Jul". */
  campaignOff: string;
  /**
   * The whole "ends" phrase on a campaign strip or deal card. A template:
   * `{date}` and `{time}` are the end instant in the shopper's own zone
   * (`campaignEndsLabel`), so each language can word and order it naturally.
   */
  campaignEndsAt: string;
  /**
   * The mirror of `campaignEndsAt`, for a campaign the merchant has shared
   * before it opens. Same `{date}`/`{time}` substitution, same zone.
   */
  campaignStartsAt: string;
  /** Sits under a scheduled campaign's header — why nothing is discounted yet. */
  campaignUpcoming: string;
  campaignOffers: string;
  previousOffer: string;
  nextOffer: string;
  /** Category-strip arrows — they replace the scrollbar on pointer devices. */
  previousCategories: string;
  nextCategories: string;
  /**
   * Rotating-hero arrows, for a merchant who chose them over the dots. Unlike
   * the category strip's, these are drawn on phones too: a shopper there can
   * swipe, but a control the merchant switched on has to be visible on the
   * device most of them are using.
   */
  previousSlide: string;
  nextSlide: string;
  /* --- account area (sidebar + sections, Rashid's Mart design) --- */
  tabWishlist: string;
  tabAddresses: string;
  tabPrefs: string;
  navProfileDesc: string;
  navOrdersDesc: string;
  navWishDesc: string;
  navAddrDesc: string;
  navPrefsDesc: string;
  personalDetails: string;
  fullNameLabel: string;
  genderLabel: string;
  dobLabel: string;
  emailLabel: string;
  phoneLabel: string;
  male: string;
  female: string;
  other: string;
  lockedNote: string;
  verified: string;
  saveChanges: string;
  cancelEdit: string;
  dismiss: string;
  prefsTitle: string;
  prefsSub: string;
  promoEmailT: string;
  promoEmailS: string;
  /** Explains that transactional order updates are not shopper-configurable. */
  prefsOrderNote: string;
  priceDropT: string;
  priceDropS: string;
  newsletterT: string;
  newsletterS: string;
  addNewAddress: string;
  workAddr: string;
  profileSaved: string;
  wishEmpty: string;
  wishEmptyMsg: string;
  moveToCart: string;
  savedItems: string;
  backToOrders: string;
  removeLabel: string;
  setDefault: string;
  /* --- printable order invoice --- */
  invoiceTitle: string;
  invoiceNo: string;
  invoiceDate: string;
  orderRef: string;
  billedTo: string;
  itemCol: string;
  unitPriceCol: string;
  qtyCol: string;
  amountCol: string;
  grandTotal: string;
  printInvoice: string;
  viewInvoice: string;
  invoiceThanks: string;
  invoiceNote: string;
  paidStamp: string;
  duePayment: string;
  youSavedLabel: string;
  trackOrder: string;
  shopNow: string;
  browseCats: string;
  featured: string;
  shopByCat: string;
  shopByAge: string;
  newArrivals: string;
  catGroceries: string;
  catElectronics: string;
  /**
   * `editorial-split`'s own headline/subtitle — deliberately generic and
   * independent of `heroBanner`. That section used to fall back to the hero's
   * copy when it had none of its own, so a page using both showed the same
   * headline twice (QA-123). Fixed copy here, not a fallback, is what keeps
   * that from happening again regardless of what the merchant writes for the
   * hero.
   */
  editorialTitle: string;
  editorialSubtitle: string;
  startShopping: string;
  selected: string;
  yourCart: string;
  emptyCartMsg: string;
  subtotal: string;
  shipping: string;
  discount: string;
  free: string;
  total: string;
  /** An advance the buyer already handed over, shown against their own order. */
  advancePaid: string;
  /** What is left to pay — never assumes delivery, since pickup uses it too. */
  amountDue: string;
  coupon: string;
  proceed: string;
  continueShopping: string;
  pageNotFound: string;
  lastUpdated: string;
  verifyNudgeTitle: string;
  verifyNudgeMsg: string;
  resendVerification: string;
  verificationSent: string;
  verifySentTo: string;
  verifySpamHint: string;
  alreadyVerified: string;
  goToAccount: string;
  verifying: string;
  verifiedThanks: string;
  verifyMissingToken: string;
  verifyToOrderTitle: string;
  iveVerified: string;
  stillUnverified: string;
  orContinueWith: string;
  /** Divider UNDER the social buttons — they lead, email is the fallback. */
  orUseEmail: string;
  continueWithGoogle: string;
  continueWithFacebook: string;
  oauthSigningIn: string;
  oauthFailed: string;
  oauthCancelled: string;
  checkout: string;
  deliveryDetails: string;
  fullName: string;
  phone: string;
  /**
   * Checkout field LABELS, as distinct from the placeholders above them.
   *
   * The checkout used to be placeholder-only, which loses the question the
   * moment the shopper answers it — by the time they reach the district they
   * can no longer see what the third box was for. Labels stay; placeholders
   * become examples of the answer, not restatements of the question.
   *
   * `mobileLabel` says "mobile" rather than "phone" on purpose: the validator
   * (and the backend) accept BD mobile numbers only, so the account page's
   * `phoneLabel` ("Phone number") would invite a landline the order rejects.
   */
  mobileLabel: string;
  phonePh: string;
  addressLineLabel: string;
  districtLabel: string;
  areaLabel: string;
  orderNotesLabel: string;
  /** Suffix on labels the shopper may leave blank. */
  optionalTag: string;
  /** The word behind the `*` on a field the shopper must fill. Shown only to a
   *  screen reader — the star is what a sighted shopper reads. */
  requiredTag: string;
  /** Group heading above name + phone, separating them from the address. */
  contactHeading: string;
  /** One line under Cash on delivery. Says only what COD already means — no
   *  claim the merchant has not made. */
  codHint: string;
  /** Heading over the merchant's own bank-transfer instructions. Frames free
   *  text the store wrote (account number, reference) as the NEXT STEP, not as
   *  another blurb — so the shopper reads it as something to act on. */
  /** Inline error under the phone field when a guest types a non-BD mobile. */
  phoneInvalid: string;
  /**
   * Per-field checkout errors. Deliberately one message PER FIELD rather than a
   * single reusable "Required" — a shopper facing a form with four blanks needs
   * to know WHICH blank, and "Required" repeated four times says only that the
   * form is unhappy. They surface on blur and on a refused Place-order attempt.
   */
  nameRequired: string;
  phoneRequired: string;
  addressRequired: string;
  districtRequired: string;
  areaRequired: string;
  termsRequiredError: string;
  /** Form-level summary shown when a submit attempt is refused. */
  checkoutFixErrors: string;
  /** Optional sign-in nudge beside the guest form — an offer, never a gate. */
  haveAccount: string;
  /** Soft "you are not signed in" notice on checkout. Informs, never blocks —
   *  guest checkout is deliberate, so this must not read as an error. */
  guestNoticeTitle: string;
  guestNoticeBody: string;
  /**
   * Order tracking failures. Three, not one: a dead link, a throttled buyer and
   * a broken request need different things done about them, and telling someone
   * with a working link to go ask the merchant for a new one is worse than
   * saying nothing. See the `t/[token]` view.
   */
  trackDeadTitle: string;
  trackDeadBody: string;
  trackThrottledTitle: string;
  trackThrottledBody: string;
  trackFailedTitle: string;
  trackFailedBody: string;
  tryAgain: string;
  /** The tracking page's own chrome — the one surface a guest ever sees. */
  trackCourier: string;
  trackTrackingCode: string;
  trackProgress: string;
  trackDeliveringTo: string;
  trackCollectFrom: string;
  trackLookUpOrder: string;
  trackBackToStore: string;
  /** Confirmation screen: the buyer's tracking link + its copy control. */
  trackYourOrder: string;
  /** Why a guest should keep that link — no account means no other way back. */
  guestKeepLink: string;
  copyLink: string;
  linkCopied: string;
  address: string;
  addressLabel: string;
  addressLabelCustom: string;
  addrHome: string;
  addrOffice: string;
  addrOther: string;
  addressLine: string;
  fulfillmentDelivery: string;
  fulfillmentPickup: string;
  pickupFrom: string;
  pickupHeading: string;
  pickupFree: string;
  deliveryZone: string;
  insideDhaka: string;
  outsideDhaka: string;
  /** Flat address mode: the question asked when the address places nothing. */
  zoneChoiceLabel: string;
  zoneChoiceHelp: string;
  zoneChoiceRequired: string;
  /** Flat address mode: how a confidently inferred zone is explained. */
  zoneDetected: string;
  zoneChange: string;
  /** Merchant-defined checkout fields. */
  fieldRequired: string;
  selectPlaceholder: string;
  addressFlatLabel: string;
  addressFlatPh: string;
  zoneDays12: string;
  zoneDays35: string;
  courierArea: string;
  selectDistrict: string;
  selectCity: string;
  selectZone: string;
  selectArea: string;
  comboNoMatch: string;
  selectThana: string;
  loadingLocations: string;
  newAddress: string;
  saveThisAddress: string;
  orderNotesPh: string;
  /** Sentence with a `{terms}` placeholder for the (optionally linked) terms label. */
  agreeToTerms: string;
  termsLinkLabel: string;
  minOrderNotice: string;
  paymentMethod: string;
  default: string;
  cod: string;
  bankTransfer: string;
  customPayment: string;
  placeOrder: string;
  orderPlaced: string;
  /** Reassurance under "Order placed". Deliberately names NO channel: SMS is
   *  plan-gated, off by default and runs on prepaid credit, and email needs an
   *  address the shopper may never have given — so promising either is a
   *  promise most stores cannot keep. Keep it channel-neutral. */
  orderThanks: string;
  orderNo: string;
  orderStatus: string;
  payStatus: string;
  payStatusPending: string;
  storeInfo: string;
  weAccept: string;
  callUs: string;
  poweredBy: string;
  links: string[];
  save: string;
  published: string;
  navHome: string;
  navShop: string;
  navProduct: string;
  navCart: string;
  navCheckout: string;
  navSearch: string;
  navAccount: string;
  /* --- floating contact launcher (Customize → WhatsApp button) --- */
  /** Default expanded label; the merchant can override it. */
  chatWithUs: string;
  /** Product page — the inline button beside Add to cart, and the launcher label. */
  askAboutThis: string;
  /** Cart + checkout label: the shopper is mid-order and stuck. */
  chatNeedHelp: string;
  /** Checkout label — for a shopper who would rather order in the chat. */
  chatOrderInstead: string;
  /** Order tracking label. */
  chatTrackOrder: string;
  /** `aria-label`, e.g. "Chat with Rashu Store on WhatsApp". */
  chatAria: string;
  /** Shown while the merchant is outside their reply hours. */
  chatAway: string;
  /** Closes the fanned-out channel list. */
  chatClose: string;
  /** Prefilled context sentences — `{x}` is filled by the page. */
  ctxProduct: string;
  ctxCart: string;
  ctxOrder: string;
  menu: string;
  allProducts: string;
  results: string;
  gridView: string;
  listView: string;
  filters: string;
  category: string;
  priceRange: string;
  brandLabel: string;
  /** Tag facet heading on the collection filter panel. */
  tagsLabel: string;
  clearAll: string;
  applyFilters: string;
  /**
   * Listing progress under an infinite / load-more grid. A template, not a
   * prefix: Bangla puts the total first, so composing this by concatenation
   * would read backwards there.
   */
  showingOf: string;
  /** Tail button on an infinite / load-more listing. */
  loadMore: string;
  prev: string;
  next: string;
  /** Landmark label on the numbered pager (`pages` mode). */
  pagination: string;
  /** Accessible name of one numbered page button. A template — `{n}` = page. */
  pageX: string;
  inStockFilter: string;
  allBrands: string;
  availability: string;
  sortLabel: string;
  sortFeatured: string;
  sortNewest: string;
  sortPriceLow: string;
  sortPriceHigh: string;
  minLabel: string;
  maxLabel: string;
  reset: string;
  /** Drawer CTA — "{n}" is replaced with the live result count. */
  showResults: string;
  onSale: string;
  inStock: string;
  outOfStock: string;
  addToCartFull: string;
  buyNow: string;
  quantity: string;
  description: string;
  specifications: string;
  /** PDP gallery affordance — CSS shows it only where a fine pointer can hover. */
  zoomHint: string;
  relatedTitle: string;
  deliveryEst: string;
  /** Neutral fallback when the merchant has not configured a delivery window. */
  deliveryOptionsCheckout: string;
  /** Shipping-backed announcement; `{amount}` is the effective free threshold. */
  freeShippingOver: string;
  reviewsWord: string;
  skuLabel: string;
  variableTitle: string;
  variableMsg: string;
  callToOrder: string;
  cartTitle: string;
  /** Why the cart quotes a "From" delivery fee — the zone is picked at checkout. */
  deliveryEstimateNote: string;
  /** Abandoned-cart recovery link outcomes. `{n}` = lines no longer available. */
  cartRestored: string;
  cartRestoredPartial: string;
  cartRestoreExpired: string;
  cartRestoreEmpty: string;
  /** Shown when signing in folded in a cart from another device. */
  cartMerged: string;
  orderSummary: string;
  estDelivery: string;
  remove: string;
  items: string;
  stepAddress: string;
  stepDelivery: string;
  stepPayment: string;
  stepReview: string;
  continueStep: string;
  backStep: string;
  reviewOrder: string;
  contactInfo: string;
  shipTo: string;
  searchTitle: string;
  searchQuery: string;
  noResults: string;
  noResultsMsg: string;
  loading: string;
  productNotFound: string;
  noOrdersYet: string;
  toggleEmpty: string;
  myAccount: string;
  tabProfile: string;
  tabOrders: string;
  tabTracking: string;
  orderHistory: string;
  viewDetails: string;
  trackThis: string;
  reorder: string;
  personalInfo: string;
  savedAddresses: string;
  editProfile: string;
  defaultLabel: string;
  logout: string;
  memberSince: string;
  totalOrders: string;
  name: string;
  email: string;
  timelinePlaced: string;
  timelineConfirmed: string;
  timelineProcessing: string;
  timelineShipped: string;
  timelineDelivered: string;
  orderCancelled: string;
  cancelOrder: string;
  confirmCancelOrder: string;
  orderItems: string;
  deliveryAddress: string;
  trackParcel: string;
  deliveryUpdates: string;
  paid: string;
  viewAllProducts: string;
  darkMode: string;
  lightMode: string;
  signIn: string;
  signUp: string;
  createAccount: string;
  signInTitle: string;
  signInSubtitle: string;
  createTitle: string;
  createSubtitle: string;
  password: string;
  forgotPassword: string;
  paidLabel: string;
  dueLabel: string;
  changePasswordTitle: string;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  passwordUpdated: string;
  passwordMismatch: string;
  passwordMin: string;
  showPassword: string;
  hidePassword: string;
  resetPwTitle: string;
  resetLinkInvalid: string;
  resetLinkSent: string;
  noAccountPrompt: string;
  haveAccountPrompt: string;
  signingIn: string;
  creatingAccount: string;
  welcomeBack: string;
  accountCreated: string;
  staffNotice: string;
  staffNoticeMsg: string;
  goToAdmin: string;
  shopAsCustomer: string;
  information: string;
  followUs: string;
  /* ---- footer layouts (Contact-first + Stay-in-touch) ------------------ */
  footerOrderByPhone: string;
  footerNewsletterHeading: string;
  footerNewsletterBlurb: string;
  footerSubscribe: string;
  footerEmailPh: string;
  footerSubscribed: string;
  footerSubscribeFailed: string;
  footerEmailInvalid: string;
}

const en: Dict = {
  langTag: "EN",
  langCode: "en-BD",
  langLabel: "English",
  searchPh: "Search products, brands & categories",
  recentSearches: "Recent searches",
  categoriesLabel: "Categories",
  account: "Account",
  cart: "Cart",
  addToCart: "Add to cart",
  fromPrice: "From",
  selectOptions: "Select options",
  fullDetails: "See full details",
  chooseOption: "Choose an option",
  viewCart: "View cart",
  campaignOff: "off",
  campaignEndsAt: "Ends {date} at {time}",
  campaignStartsAt: "Starts {date} at {time}",
  campaignUpcoming: "This sale hasn't started yet — prices drop when it opens.",
  campaignOffers: "Current offers",
  previousOffer: "Previous offer",
  nextOffer: "Next offer",
  previousCategories: "Previous categories",
  nextCategories: "Next categories",
  previousSlide: "Previous slide",
  nextSlide: "Next slide",
  tabWishlist: "Wishlist",
  tabAddresses: "Addresses",
  tabPrefs: "Notifications",
  navProfileDesc: "Personal details",
  navOrdersDesc: "History & tracking",
  navWishDesc: "Saved items",
  navAddrDesc: "Delivery locations",
  navPrefsDesc: "Emails & alerts",
  personalDetails: "Personal details",
  fullNameLabel: "Full name",
  genderLabel: "Gender",
  dobLabel: "Date of birth",
  emailLabel: "Email address",
  phoneLabel: "Phone number",
  male: "Male",
  female: "Female",
  other: "Other",
  lockedNote: "Contact support to change",
  verified: "Verified",
  saveChanges: "Save changes",
  cancelEdit: "Cancel",
  dismiss: "Dismiss",
  prefsTitle: "Notifications",
  prefsSub: "Choose what you want to hear about.",
  promoEmailT: "Promotional emails",
  promoEmailS: "Deals, offers and seasonal sales",
  prefsOrderNote:
    "Order updates are sent by the store and can't be turned off here.",
  priceDropT: "Price-drop alerts",
  priceDropS: "When wishlist items get cheaper",
  newsletterT: "Weekly newsletter",
  newsletterS: "New arrivals and curated picks",
  addNewAddress: "Add address",
  workAddr: "Office",
  profileSaved: "Profile updated",
  wishEmpty: "Your wishlist is empty",
  wishEmptyMsg: "Tap the heart on any product to save it here for later.",
  moveToCart: "Move to cart",
  savedItems: "saved",
  backToOrders: "Back to orders",
  removeLabel: "Remove",
  setDefault: "Set as default",
  invoiceTitle: "Invoice",
  invoiceNo: "Invoice no.",
  invoiceDate: "Issue date",
  orderRef: "Order ref.",
  billedTo: "Billed to",
  itemCol: "Item",
  unitPriceCol: "Unit price",
  qtyCol: "Qty",
  amountCol: "Amount",
  grandTotal: "Total due",
  printInvoice: "Print / Save PDF",
  viewInvoice: "Invoice",
  invoiceThanks: "Thank you for shopping with us.",
  invoiceNote: "This is a computer-generated invoice and does not require a signature.",
  paidStamp: "PAID",
  duePayment: "Payment due",
  youSavedLabel: "You saved",
  viewAll: "View all",
  added: "Added to cart",
  trackOrder: "Track order",
  shopNow: "Shop now",
  browseCats: "Browse categories",
  featured: "Featured products",
  shopByCat: "Shop by category",
  shopByAge: "Shop by age",
  newArrivals: "New arrivals",
  catGroceries: "Groceries",
  catElectronics: "Electronics",
  editorialTitle: "Worth a closer look",
  editorialSubtitle: "A few of our favourites, picked for you.",
  startShopping: "Start shopping",
  selected: "Selected for you",
  yourCart: "Your cart",
  emptyCartMsg: "Your cart is empty",
  subtotal: "Subtotal",
  shipping: "Shipping",
  discount: "Discount",
  free: "Free",
  total: "Total",
  advancePaid: "Advance paid",
  amountDue: "Amount due",
  coupon: "Coupon",
  proceed: "Checkout",
  continueShopping: "Continue shopping",
  pageNotFound: "Page not found",
  lastUpdated: "Last updated",
  verifyNudgeTitle: "Verify your email",
  verifyNudgeMsg: "We sent a confirmation link to your inbox. Didn't get it?",
  resendVerification: "Resend email",
  verificationSent: "Verification email sent — check your inbox",
  verifySentTo: "We sent a verification link to",
  verifySpamHint: "Click the link in that email to activate your account. Check the spam folder if you don't see it.",
  alreadyVerified: "Your email is verified.",
  goToAccount: "Go to my account",
  verifying: "Verifying…",
  verifiedThanks: "Your email is verified. Thanks!",
  verifyMissingToken: "This link is incomplete — open the button link from the verification email.",
  verifyToOrderTitle: "Verify your email to place your order",
  iveVerified: "I've verified",
  stillUnverified: "Still unverified — click the link in your email first.",
  orContinueWith: "or continue with",
  orUseEmail: "or use your email",
  continueWithGoogle: "Continue with Google",
  continueWithFacebook: "Continue with Facebook",
  oauthSigningIn: "Signing you in…",
  oauthFailed: "Sign-in didn't complete. Please try again.",
  oauthCancelled: "Sign-in was cancelled.",
  checkout: "Checkout",
  deliveryDetails: "Delivery details",
  fullName: "Full name",
  phone: "Phone number",
  mobileLabel: "Mobile number",
  phonePh: "01XXXXXXXXX",
  addressLineLabel: "Street address",
  districtLabel: "District",
  areaLabel: "Area / upazila",
  orderNotesLabel: "Delivery notes",
  optionalTag: "optional",
  requiredTag: "required",
  contactHeading: "Contact",
  codHint: "Pay when your order arrives",
  phoneInvalid: "Enter a valid Bangladeshi mobile number, e.g. 01712345678",
  nameRequired: "Enter your full name",
  phoneRequired: "Enter your mobile number",
  addressRequired: "Enter your delivery address",
  districtRequired: "Select your district",
  areaRequired: "Select or type your area",
  termsRequiredError: "Please accept the terms to continue",
  checkoutFixErrors: "Please complete the highlighted fields.",
  haveAccount: "Already have an account?",
  guestNoticeTitle: "You're not signed in",
  guestNoticeBody:
    "You can order as a guest — nothing extra is needed. Just note this order won't be saved to an account, and the tracking link you get at the end will be your only way back to it.",
  trackDeadTitle: "This tracking link is no longer valid",
  trackDeadBody:
    "It may have expired, or the address may be incomplete. Ask the store for a fresh link, or look your order up with its number and your phone number.",
  trackThrottledTitle: "You've checked this a few times just now",
  trackThrottledBody:
    "Your link is fine — we've just paused the updates for a moment. Wait a minute and try again.",
  trackFailedTitle: "We couldn't load your order",
  trackFailedBody:
    "Something went wrong at our end, not with your link. Try again in a moment.",
  tryAgain: "Try again",
  trackCourier: "Courier",
  trackTrackingCode: "Tracking code",
  trackProgress: "Progress",
  trackDeliveringTo: "Delivering to",
  trackCollectFrom: "Collect from",
  trackLookUpOrder: "Look up an order",
  trackBackToStore: "Back to the store",
  trackYourOrder: "Track your order",
  guestKeepLink: "Save this link — without an account it's your only way back to this order.",
  copyLink: "Copy link",
  linkCopied: "Link copied",
  address: "Full address",
  addressLabel: "Address label",
  addressLabelCustom: "Label name",
  addrHome: "Home",
  addrOffice: "Office",
  addrOther: "Other",
  addressLine: "House, road, block",
  fulfillmentDelivery: "Delivery",
  fulfillmentPickup: "Store pickup",
  pickupFrom: "Pick up from",
  pickupHeading: "Your details",
  pickupFree: "Free (pickup)",
  deliveryZone: "Delivery zone",
  insideDhaka: "Inside Dhaka",
  outsideDhaka: "Outside Dhaka",
  zoneChoiceLabel: "Where are we delivering?",
  zoneChoiceHelp: "We could not tell from the address, so please pick one.",
  zoneChoiceRequired: "Please choose a delivery area",
  zoneDetected: "From your address",
  zoneChange: "Change",
  fieldRequired: "This is required",
  selectPlaceholder: "Choose one",
  addressFlatLabel: "Full delivery address",
  addressFlatPh: "House, road, area, district",
  zoneDays12: "1–2 days",
  zoneDays35: "3–5 days",
  courierArea: "Delivery area",
  selectDistrict: "Select district",
  selectCity: "Select city",
  selectZone: "Select zone",
  selectArea: "Area / upazila / thana",
  comboNoMatch: "No matches — type to add your own",
  selectThana: "Select thana",
  loadingLocations: "Loading…",
  newAddress: "New address",
  saveThisAddress: "Save this address",
  orderNotesPh: "Gate code, landmark, best time to call",
  agreeToTerms: "I agree to the {terms}",
  termsLinkLabel: "terms & conditions",
  minOrderNotice: "Minimum order value:",
  paymentMethod: "Payment method",
  default: "Default",
  cod: "Cash on Delivery",
  bankTransfer: "Bank Transfer",
  customPayment: "Custom payment",
  placeOrder: "Place order",
  orderPlaced: "Order placed",
  orderThanks: "Thanks — the store will confirm your order shortly.",
  orderNo: "Order",
  orderStatus: "Status",
  payStatus: "Payment",
  payStatusPending: "Pending",
  // Industry-neutral on purpose: this is the fallback for EVERY store, so it
  // must not presume a shop type. It read "Your neighbourhood mart, online.
  // Authentic brands, fair prices…" — wrong for a fashion or pharmacy shop, and
  // it made a quality claim on the merchant's behalf that they never wrote
  // (QA-034). What is left is only what is true of any store on the platform.
  storeInfo: "Shop online with confidence. Delivered across Bangladesh — pay cash on delivery or by bank transfer.",
  weAccept: "We accept",
  callUs: "Call us",
  poweredBy: "Powered by",
  links: ["About us", "How to order", "Return policy", "Track order", "Contact"],
  save: "Save",
  published: "Published",
  navHome: "Home",
  navShop: "Shop",
  navProduct: "Product",
  navCart: "Cart",
  navCheckout: "Checkout",
  navSearch: "Search",
  navAccount: "Account",
  chatWithUs: "Chat with us",
  askAboutThis: "Ask about this",
  chatNeedHelp: "Need help?",
  chatOrderInstead: "Order on chat instead",
  chatTrackOrder: "Track on chat",
  chatAria: "Chat with {store} on {channel}",
  chatAway: "Away — back {when}",
  chatClose: "Close chat options",
  ctxProduct: "I'd like to know more about {product}.",
  ctxCart: "I have {count} item(s) in my cart and need help.",
  ctxOrder: "I'm checking on order {order}.",
  menu: "Menu",
  allProducts: "All products",
  results: "results",
  gridView: "Grid view",
  listView: "List view",
  filters: "Filters",
  category: "Category",
  priceRange: "Price range",
  brandLabel: "Brand",
  tagsLabel: "Tags",
  clearAll: "Clear all",
  applyFilters: "Apply",
  showingOf: "Showing {n} of {total}",
  loadMore: "Load more",
  prev: "Prev",
  next: "Next",
  pagination: "Pagination",
  pageX: "Page {n}",
  inStockFilter: "In stock only",
  allBrands: "All brands",
  availability: "Availability",
  sortLabel: "Sort",
  sortFeatured: "Featured",
  sortNewest: "Newest",
  sortPriceLow: "Price: low to high",
  sortPriceHigh: "Price: high to low",
  minLabel: "Min",
  maxLabel: "Max",
  reset: "Reset",
  showResults: "Show {n} results",
  onSale: "On sale",
  inStock: "In stock",
  outOfStock: "Out of stock",
  addToCartFull: "Add to cart",
  buyNow: "Buy now",
  quantity: "Quantity",
  description: "Description",
  specifications: "Specifications",
  zoomHint: "Hover to zoom",
  relatedTitle: "You may also like",
  deliveryEst: "Delivery options shown at checkout",
  deliveryOptionsCheckout: "Delivery options shown at checkout",
  freeShippingOver: "Free delivery on orders over {amount}",
  reviewsWord: "reviews",
  skuLabel: "SKU",
  variableTitle: "Available in-store only",
  variableMsg: "This product has selectable options (size, bundle) and is not sold online. Visit any Rashid’s Mart outlet or call to order.",
  callToOrder: "Call to order",
  cartTitle: "Shopping cart",
  deliveryEstimateNote:
    "Delivery is charged by area. The exact amount is confirmed at checkout once you choose yours.",
  cartRestored: "Welcome back — your cart is here.",
  cartRestoredPartial:
    "Your cart is back. {n} item(s) are no longer available and were removed.",
  cartRestoreExpired: "That link has expired. Your cart may still be saved here.",
  cartRestoreEmpty: "Those items are no longer available.",
  cartMerged: "We added the items from your other device.",
  orderSummary: "Order summary",
  estDelivery: "Estimated delivery",
  remove: "Remove",
  items: "items",
  stepAddress: "Address",
  stepDelivery: "Delivery",
  stepPayment: "Payment",
  stepReview: "Review",
  continueStep: "Continue",
  backStep: "Back",
  reviewOrder: "Review your order",
  contactInfo: "Contact information",
  shipTo: "Ship to",
  searchTitle: "Search results",
  searchQuery: "cordless drill",
  noResults: "No results found",
  noResultsMsg: "We couldn’t find anything matching your search. Try a different keyword.",
  loading: "Loading…",
  productNotFound: "Product not found",
  noOrdersYet: "No orders yet — your orders will appear here once you place one.",
  toggleEmpty: "Toggle empty state",
  myAccount: "My account",
  tabProfile: "Profile",
  tabOrders: "Orders",
  tabTracking: "Tracking",
  orderHistory: "Order history",
  viewDetails: "View details",
  trackThis: "Track order",
  reorder: "Reorder",
  personalInfo: "Personal information",
  savedAddresses: "Saved addresses",
  editProfile: "Edit",
  defaultLabel: "Default",
  logout: "Log out",
  memberSince: "Member since",
  totalOrders: "Total orders",
  name: "Name",
  email: "Email",
  timelinePlaced: "Order placed",
  timelineConfirmed: "Confirmed",
  timelineProcessing: "Processing",
  timelineShipped: "Shipped",
  timelineDelivered: "Delivered",
  orderCancelled: "Order cancelled",
  cancelOrder: "Cancel order",
  confirmCancelOrder: "Cancel this order? This can’t be undone.",
  orderItems: "Order items",
  deliveryAddress: "Delivery address",
  trackParcel: "Track parcel",
  deliveryUpdates: "Delivery updates",
  paid: "Paid",
  viewAllProducts: "Browse all products",
  darkMode: "Dark",
  lightMode: "Light",
  signIn: "Sign in",
  signUp: "Sign up",
  createAccount: "Create account",
  signInTitle: "Welcome back",
  signInSubtitle: "Sign in to track orders and check out faster.",
  createTitle: "Create your account",
  createSubtitle: "Save your details for a faster checkout next time.",
  password: "Password",
  forgotPassword: "Forgot password?",
  paidLabel: "Paid",
  dueLabel: "Due",
  changePasswordTitle: "Change password",
  currentPasswordLabel: "Current password",
  newPasswordLabel: "New password",
  confirmPasswordLabel: "Confirm new password",
  passwordUpdated: "Password updated",
  passwordMismatch: "Passwords don't match",
  passwordMin: "Password must be at least 6 characters",
  showPassword: "Show password",
  hidePassword: "Hide password",
  resetPwTitle: "Reset your password",
  resetLinkInvalid: "This reset link is invalid or expired.",
  resetLinkSent: "Reset link sent — check your inbox",
  noAccountPrompt: "New customer?",
  haveAccountPrompt: "Already have an account?",
  signingIn: "Signing in…",
  creatingAccount: "Creating account…",
  welcomeBack: "Welcome back!",
  accountCreated: "Account created!",
  staffNotice: "You're signed in as staff",
  staffNoticeMsg:
    "This is the customer area of your store. Manage your store from the admin dashboard — or sign in below as a customer to test the shopping experience.",
  goToAdmin: "Go to admin dashboard",
  shopAsCustomer: "Shop as a customer",
  information: "Information",
  followUs: "Follow us",
  footerOrderByPhone: "Order by phone",
  footerNewsletterHeading: "Stay in touch",
  footerNewsletterBlurb:
    "Get new arrivals and offers before anyone else. One email a week, never more.",
  footerSubscribe: "Subscribe",
  footerEmailPh: "your@email.com",
  footerSubscribed: "You're on the list. Thank you!",
  footerSubscribeFailed: "Couldn't sign you up. Please try again.",
  footerEmailInvalid: "Enter a valid email address",
};

const bn: Dict = {
  langTag: "বাংলা",
  langCode: "bn-BD",
  langLabel: "বাংলা",
  searchPh: "পণ্য, ব্র্যান্ড ও ক্যাটাগরি খুঁজুন",
  recentSearches: "সাম্প্রতিক সার্চ",
  categoriesLabel: "ক্যাটাগরি",
  account: "অ্যাকাউন্ট",
  cart: "কার্ট",
  addToCart: "কার্টে যোগ করুন",
  fromPrice: "শুরু",
  selectOptions: "ভ্যারিয়েন্ট বাছাই করুন",
  fullDetails: "সম্পূর্ণ বিবরণ দেখুন",
  chooseOption: "অপশন বাছাই করুন",
  viewCart: "কার্ট দেখুন",
  campaignOff: "ছাড়",
  campaignEndsAt: "শেষ হবে {date}, {time}",
  campaignStartsAt: "শুরু হবে {date}, {time}",
  campaignUpcoming: "অফারটি এখনও শুরু হয়নি — শুরু হলেই দাম কমে যাবে।",
  campaignOffers: "চলতি অফার",
  previousOffer: "আগের অফার",
  nextOffer: "পরের অফার",
  previousCategories: "আগের ক্যাটাগরি",
  nextCategories: "পরের ক্যাটাগরি",
  previousSlide: "আগের স্লাইড",
  nextSlide: "পরের স্লাইড",
  tabWishlist: "উইশলিস্ট",
  tabAddresses: "ঠিকানা",
  tabPrefs: "নোটিফিকেশন",
  navProfileDesc: "ব্যক্তিগত তথ্য",
  navOrdersDesc: "হিস্ট্রি ও ট্র্যাকিং",
  navWishDesc: "সংরক্ষিত পণ্য",
  navAddrDesc: "ডেলিভারি ঠিকানা",
  navPrefsDesc: "ইমেইল ও অ্যালার্ট",
  personalDetails: "ব্যক্তিগত তথ্য",
  fullNameLabel: "পুরো নাম",
  genderLabel: "লিঙ্গ",
  dobLabel: "জন্ম তারিখ",
  emailLabel: "ইমেইল ঠিকানা",
  phoneLabel: "ফোন নম্বর",
  male: "পুরুষ",
  female: "মহিলা",
  other: "অন্যান্য",
  lockedNote: "পরিবর্তনে সাপোর্টে যোগাযোগ করুন",
  verified: "ভেরিফায়েড",
  saveChanges: "সেভ করুন",
  cancelEdit: "বাতিল",
  dismiss: "বন্ধ করুন",
  prefsTitle: "নোটিফিকেশন",
  prefsSub: "আপনি কী জানতে চান তা বেছে নিন।",
  promoEmailT: "প্রোমোশনাল ইমেইল",
  promoEmailS: "ডিল, অফার ও সিজনাল সেল",
  prefsOrderNote:
    "অর্ডার আপডেট স্টোর থেকে পাঠানো হয়, এখান থেকে বন্ধ করা যাবে না।",
  priceDropT: "দাম কমার অ্যালার্ট",
  priceDropS: "উইশলিস্টের পণ্যের দাম কমলে",
  newsletterT: "সাপ্তাহিক নিউজলেটার",
  newsletterS: "নতুন পণ্য ও বাছাই",
  addNewAddress: "ঠিকানা যোগ করুন",
  workAddr: "অফিস",
  profileSaved: "প্রোফাইল আপডেট হয়েছে",
  wishEmpty: "আপনার উইশলিস্ট খালি",
  wishEmptyMsg: "যেকোনো পণ্যের হার্টে ট্যাপ করে এখানে সংরক্ষণ করুন।",
  moveToCart: "কার্টে নিন",
  savedItems: "সংরক্ষিত",
  backToOrders: "অর্ডারে ফিরুন",
  removeLabel: "মুছুন",
  setDefault: "ডিফল্ট করুন",
  invoiceTitle: "ইনভয়েস",
  invoiceNo: "ইনভয়েস নং",
  invoiceDate: "ইস্যু তারিখ",
  orderRef: "অর্ডার রেফ.",
  billedTo: "বিল প্রাপক",
  itemCol: "পণ্য",
  unitPriceCol: "একক দাম",
  qtyCol: "পরিমাণ",
  amountCol: "মোট",
  grandTotal: "প্রদেয়",
  printInvoice: "প্রিন্ট / PDF সেভ",
  viewInvoice: "ইনভয়েস",
  invoiceThanks: "আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ।",
  invoiceNote: "এটি একটি কম্পিউটার-জেনারেটেড ইনভয়েস, স্বাক্ষরের প্রয়োজন নেই।",
  paidStamp: "পরিশোধিত",
  duePayment: "প্রদেয়",
  youSavedLabel: "আপনি সাশ্রয় করলেন",
  viewAll: "সব দেখুন",
  added: "কার্টে যোগ হয়েছে",
  trackOrder: "অর্ডার ট্র্যাক",
  shopNow: "কিনুন",
  browseCats: "ক্যাটাগরি দেখুন",
  featured: "ফিচার্ড পণ্য",
  shopByCat: "ক্যাটাগরি অনুযায়ী",
  shopByAge: "বয়স অনুযায়ী",
  newArrivals: "নতুন এসেছে",
  catGroceries: "মুদি",
  catElectronics: "ইলেকট্রনিক্স",
  editorialTitle: "একটু কাছ থেকে দেখুন",
  editorialSubtitle: "আপনার জন্য বেছে নেওয়া কিছু পণ্য।",
  startShopping: "কেনাকাটা শুরু",
  selected: "আপনার জন্য বাছাই",
  yourCart: "আপনার কার্ট",
  emptyCartMsg: "আপনার কার্ট খালি",
  subtotal: "সাবটোটাল",
  shipping: "শিপিং",
  discount: "ছাড়",
  free: "ফ্রি",
  total: "মোট",
  advancePaid: "অগ্রিম পরিশোধিত",
  amountDue: "বাকি আছে",
  coupon: "কুপন",
  proceed: "চেকআউট",
  continueShopping: "কেনাকাটা চালিয়ে যান",
  pageNotFound: "পৃষ্ঠা পাওয়া যায়নি",
  lastUpdated: "সর্বশেষ আপডেট",
  verifyNudgeTitle: "আপনার ইমেইল যাচাই করুন",
  verifyNudgeMsg: "আপনার ইনবক্সে একটি নিশ্চিতকরণ লিংক পাঠানো হয়েছে। পাননি?",
  resendVerification: "আবার পাঠান",
  verificationSent: "যাচাইকরণ ইমেইল পাঠানো হয়েছে — ইনবক্স দেখুন",
  verifySentTo: "আমরা একটি যাচাইকরণ লিংক পাঠিয়েছি",
  verifySpamHint: "অ্যাকাউন্ট সক্রিয় করতে ইমেইলের লিংকে ক্লিক করুন। না পেলে স্প্যাম ফোল্ডার দেখুন।",
  alreadyVerified: "আপনার ইমেইল যাচাই হয়ে গেছে।",
  goToAccount: "আমার অ্যাকাউন্টে যান",
  verifying: "যাচাই করা হচ্ছে…",
  verifiedThanks: "আপনার ইমেইল যাচাই হয়েছে। ধন্যবাদ!",
  verifyMissingToken: "লিংকটি অসম্পূর্ণ — যাচাইকরণ ইমেইলের বাটন লিংকটি খুলুন।",
  verifyToOrderTitle: "অর্ডার করতে আপনার ইমেইল যাচাই করুন",
  iveVerified: "যাচাই করেছি",
  stillUnverified: "এখনও যাচাই হয়নি — আগে ইমেইলের লিংকে ক্লিক করুন।",
  orContinueWith: "অথবা চালিয়ে যান",
  orUseEmail: "অথবা ইমেইল ব্যবহার করুন",
  continueWithGoogle: "Google দিয়ে চালিয়ে যান",
  continueWithFacebook: "Facebook দিয়ে চালিয়ে যান",
  oauthSigningIn: "সাইন ইন করা হচ্ছে…",
  oauthFailed: "সাইন-ইন সম্পন্ন হয়নি। আবার চেষ্টা করুন।",
  oauthCancelled: "সাইন-ইন বাতিল করা হয়েছে।",
  checkout: "চেকআউট",
  deliveryDetails: "ডেলিভারি তথ্য",
  fullName: "পুরো নাম",
  phone: "ফোন নম্বর",
  mobileLabel: "মোবাইল নম্বর",
  phonePh: "01XXXXXXXXX",
  addressLineLabel: "রাস্তার ঠিকানা",
  districtLabel: "জেলা",
  areaLabel: "এলাকা / উপজেলা",
  orderNotesLabel: "ডেলিভারি নোট",
  optionalTag: "ঐচ্ছিক",
  requiredTag: "আবশ্যক",
  contactHeading: "যোগাযোগ",
  codHint: "অর্ডার পৌঁছালে টাকা পরিশোধ করুন",
  phoneInvalid: "সঠিক বাংলাদেশি মোবাইল নম্বর দিন, যেমন ০১৭১২৩৪৫৬৭৮",
  nameRequired: "আপনার পুরো নাম লিখুন",
  phoneRequired: "আপনার মোবাইল নম্বর লিখুন",
  addressRequired: "আপনার ডেলিভারি ঠিকানা লিখুন",
  districtRequired: "আপনার জেলা নির্বাচন করুন",
  areaRequired: "আপনার এলাকা নির্বাচন করুন বা লিখুন",
  termsRequiredError: "চালিয়ে যেতে শর্তাবলিতে সম্মতি দিন",
  checkoutFixErrors: "চিহ্নিত ঘরগুলো পূরণ করুন।",
  haveAccount: "আগে থেকে অ্যাকাউন্ট আছে?",
  guestNoticeTitle: "আপনি সাইন ইন করেননি",
  guestNoticeBody:
    "গেস্ট হিসেবেও অর্ডার করতে পারবেন — বাড়তি কিছু লাগবে না। শুধু মনে রাখবেন, এই অর্ডারটি কোনো অ্যাকাউন্টে সংরক্ষিত থাকবে না, আর শেষে যে ট্র্যাকিং লিংক পাবেন সেটিই এই অর্ডারে ফিরে আসার একমাত্র উপায়।",
  trackDeadTitle: "এই ট্র্যাকিং লিংকটি আর কাজ করছে না",
  trackDeadBody:
    "লিংকের মেয়াদ শেষ হয়ে থাকতে পারে, অথবা ঠিকানাটি অসম্পূর্ণ। দোকান থেকে নতুন লিংক চেয়ে নিন, কিংবা অর্ডার নম্বর ও ফোন নম্বর দিয়ে অর্ডারটি খুঁজুন।",
  trackThrottledTitle: "আপনি একটু আগে কয়েকবার দেখেছেন",
  trackThrottledBody:
    "আপনার লিংক ঠিকই আছে — আমরা শুধু কিছুক্ষণের জন্য আপডেট দেখানো থামিয়েছি। এক মিনিট পর আবার চেষ্টা করুন।",
  trackFailedTitle: "আপনার অর্ডার লোড করা যায়নি",
  trackFailedBody:
    "সমস্যাটি আমাদের দিকে, আপনার লিংকে নয়। কিছুক্ষণ পর আবার চেষ্টা করুন।",
  tryAgain: "আবার চেষ্টা করুন",
  trackCourier: "কুরিয়ার",
  trackTrackingCode: "ট্র্যাকিং কোড",
  trackProgress: "অগ্রগতি",
  trackDeliveringTo: "ডেলিভারি হচ্ছে",
  trackCollectFrom: "সংগ্রহের স্থান",
  trackLookUpOrder: "অর্ডার খুঁজুন",
  trackBackToStore: "দোকানে ফিরে যান",
  trackYourOrder: "অর্ডার ট্র্যাক করুন",
  guestKeepLink: "লিংকটি সংরক্ষণ করুন — অ্যাকাউন্ট ছাড়া এই অর্ডারে ফিরে আসার এটিই একমাত্র উপায়।",
  copyLink: "লিংক কপি করুন",
  linkCopied: "লিংক কপি হয়েছে",
  address: "সম্পূর্ণ ঠিকানা",
  addressLabel: "ঠিকানার লেবেল",
  addressLabelCustom: "লেবেলের নাম",
  addrHome: "বাসা",
  addrOffice: "অফিস",
  addrOther: "অন্যান্য",
  addressLine: "বাসা, রোড, ব্লক",
  fulfillmentDelivery: "ডেলিভারি",
  fulfillmentPickup: "স্টোরে পিকআপ",
  pickupFrom: "পিকআপ স্থান",
  pickupHeading: "আপনার তথ্য",
  pickupFree: "ফ্রি (পিকআপ)",
  deliveryZone: "ডেলিভারি জোন",
  zoneChoiceLabel: "কোথায় ডেলিভারি হবে?",
  zoneChoiceHelp: "ঠিকানা থেকে বোঝা যায়নি, তাই একটি বেছে নিন।",
  zoneChoiceRequired: "ডেলিভারি এলাকা বেছে নিন",
  zoneDetected: "আপনার ঠিকানা থেকে",
  zoneChange: "পরিবর্তন",
  fieldRequired: "এটি আবশ্যক",
  selectPlaceholder: "একটি বেছে নিন",
  addressFlatLabel: "সম্পূর্ণ ডেলিভারি ঠিকানা",
  addressFlatPh: "বাসা, রোড, এলাকা, জেলা",
  insideDhaka: "ঢাকার ভিতরে",
  outsideDhaka: "ঢাকার বাইরে",
  zoneDays12: "১–২ দিন",
  zoneDays35: "৩–৫ দিন",
  courierArea: "ডেলিভারি এলাকা",
  selectDistrict: "জেলা নির্বাচন করুন",
  selectCity: "শহর নির্বাচন করুন",
  selectZone: "জোন নির্বাচন করুন",
  selectArea: "এলাকা / উপজেলা / থানা",
  comboNoMatch: "কোনো মিল নেই — নিজে টাইপ করুন",
  selectThana: "থানা নির্বাচন করুন",
  loadingLocations: "লোড হচ্ছে…",
  newAddress: "নতুন ঠিকানা",
  saveThisAddress: "এই ঠিকানা সংরক্ষণ করুন",
  orderNotesPh: "গেট কোড, ল্যান্ডমার্ক, কল করার উপযুক্ত সময়",
  agreeToTerms: "আমি {terms}তে সম্মত",
  termsLinkLabel: "নিয়ম ও শর্তাবলী",
  minOrderNotice: "সর্বনিম্ন অর্ডার মূল্য:",
  paymentMethod: "পেমেন্ট মাধ্যম",
  default: "ডিফল্ট",
  cod: "ক্যাশ অন ডেলিভারি",
  bankTransfer: "ব্যাংক ট্রান্সফার",
  customPayment: "কাস্টম পেমেন্ট",
  placeOrder: "অর্ডার করুন",
  orderPlaced: "অর্ডার সম্পন্ন",
  orderThanks: "ধন্যবাদ — দোকান শীঘ্রই আপনার অর্ডার নিশ্চিত করবে।",
  orderNo: "অর্ডার",
  orderStatus: "স্ট্যাটাস",
  payStatus: "পেমেন্ট",
  payStatusPending: "বাকি",
  storeInfo: "নিশ্চিন্তে অনলাইনে কেনাকাটা করুন। সারা বাংলাদেশে ডেলিভারি — ক্যাশ অন ডেলিভারি বা ব্যাংক ট্রান্সফারে পেমেন্ট।",
  weAccept: "আমরা গ্রহণ করি",
  callUs: "কল করুন",
  poweredBy: "পরিচালিত",
  links: ["আমাদের সম্পর্কে", "কীভাবে অর্ডার", "রিটার্ন নীতি", "অর্ডার ট্র্যাক", "যোগাযোগ"],
  save: "সেভ",
  published: "প্রকাশিত",
  navHome: "হোম",
  navShop: "শপ",
  navProduct: "পণ্য",
  navCart: "কার্ট",
  navCheckout: "চেকআউট",
  navSearch: "সার্চ",
  navAccount: "অ্যাকাউন্ট",
  chatWithUs: "চ্যাট করুন",
  askAboutThis: "এটি সম্পর্কে জিজ্ঞাসা",
  chatNeedHelp: "সাহায্য লাগবে?",
  chatOrderInstead: "চ্যাটে অর্ডার করুন",
  chatTrackOrder: "চ্যাটে ট্র্যাক করুন",
  chatAria: "{channel}-এ {store}-এর সাথে চ্যাট করুন",
  chatAway: "এখন বন্ধ — {when} ফিরছি",
  chatClose: "চ্যাট অপশন বন্ধ করুন",
  ctxProduct: "আমি {product} সম্পর্কে জানতে চাই।",
  ctxCart: "আমার কার্টে {count}টি পণ্য আছে, সাহায্য দরকার।",
  ctxOrder: "আমি {order} অর্ডারটির খোঁজ নিচ্ছি।",
  menu: "মেনু",
  allProducts: "সব পণ্য",
  results: "ফলাফল",
  gridView: "গ্রিড ভিউ",
  listView: "তালিকা ভিউ",
  filters: "ফিল্টার",
  category: "ক্যাটাগরি",
  priceRange: "দামের পরিসীমা",
  brandLabel: "ব্র্যান্ড",
  tagsLabel: "ট্যাগ",
  clearAll: "সব মুছুন",
  applyFilters: "প্রয়োগ",
  showingOf: "{total}টির মধ্যে {n}টি দেখাচ্ছে",
  loadMore: "আরও দেখুন",
  prev: "আগের",
  next: "পরের",
  pagination: "পৃষ্ঠা নেভিগেশন",
  pageX: "পৃষ্ঠা {n}",
  inStockFilter: "শুধু স্টকে আছে",
  allBrands: "সব ব্র্যান্ড",
  availability: "স্টক",
  sortLabel: "সাজান",
  sortFeatured: "ফিচার্ড",
  sortNewest: "নতুন আগে",
  sortPriceLow: "দাম: কম থেকে বেশি",
  sortPriceHigh: "দাম: বেশি থেকে কম",
  minLabel: "সর্বনিম্ন",
  maxLabel: "সর্বোচ্চ",
  reset: "রিসেট",
  showResults: "{n}টি ফলাফল দেখুন",
  onSale: "ছাড়ে",
  inStock: "স্টকে আছে",
  outOfStock: "স্টকে নেই",
  addToCartFull: "কার্টে যোগ করুন",
  buyNow: "এখনই কিনুন",
  quantity: "পরিমাণ",
  description: "বিবরণ",
  specifications: "স্পেসিফিকেশন",
  zoomHint: "জুম করতে হোভার করুন",
  relatedTitle: "আরও পছন্দ হতে পারে",
  deliveryEst: "চেকআউটে ডেলিভারির তথ্য দেখানো হবে",
  deliveryOptionsCheckout: "চেকআউটে ডেলিভারির তথ্য দেখানো হবে",
  freeShippingOver: "{amount}-এর বেশি অর্ডারে ফ্রি ডেলিভারি",
  reviewsWord: "রিভিউ",
  skuLabel: "এসকেইউ",
  variableTitle: "শুধু দোকানে পাওয়া যায়",
  variableMsg: "এই পণ্যে নির্বাচনযোগ্য অপশন (সাইজ, বান্ডেল) আছে এবং অনলাইনে বিক্রি হয় না। যেকোনো রশিদ’স মার্ট আউটলেটে যান বা কল করে অর্ডার করুন।",
  callToOrder: "কল করে অর্ডার",
  cartTitle: "শপিং কার্ট",
  deliveryEstimateNote:
    "ডেলিভারি চার্জ এলাকা অনুযায়ী। আপনি এলাকা বেছে নিলে চেকআউটে সঠিক পরিমাণ নিশ্চিত হবে।",
  cartRestored: "আবার স্বাগতম — আপনার কার্ট এখানে আছে।",
  cartRestoredPartial:
    "আপনার কার্ট ফিরে এসেছে। {n}টি পণ্য আর পাওয়া যাচ্ছে না বলে সরিয়ে দেওয়া হয়েছে।",
  cartRestoreExpired: "লিংকটির মেয়াদ শেষ। আপনার কার্ট এখানে সংরক্ষিত থাকতে পারে।",
  cartRestoreEmpty: "ওই পণ্যগুলো আর পাওয়া যাচ্ছে না।",
  cartMerged: "আপনার অন্য ডিভাইসের পণ্যগুলো যোগ করা হয়েছে।",
  orderSummary: "অর্ডার সামারি",
  estDelivery: "আনুমানিক ডেলিভারি",
  remove: "সরান",
  items: "পণ্য",
  stepAddress: "ঠিকানা",
  stepDelivery: "ডেলিভারি",
  stepPayment: "পেমেন্ট",
  stepReview: "রিভিউ",
  continueStep: "এগিয়ে যান",
  backStep: "পেছনে",
  reviewOrder: "অর্ডার যাচাই করুন",
  contactInfo: "যোগাযোগের তথ্য",
  shipTo: "পাঠানো হবে",
  searchTitle: "সার্চ ফলাফল",
  searchQuery: "কর্ডলেস ড্রিল",
  noResults: "কোনো ফলাফল নেই",
  noResultsMsg: "আপনার সার্চের সাথে মিল পাওয়া যায়নি। অন্য কীওয়ার্ড চেষ্টা করুন।",
  loading: "লোড হচ্ছে…",
  productNotFound: "পণ্যটি পাওয়া যায়নি",
  noOrdersYet: "এখনো কোনো অর্ডার নেই — অর্ডার করলে এখানে দেখা যাবে।",
  toggleEmpty: "খালি অবস্থা",
  myAccount: "আমার অ্যাকাউন্ট",
  tabProfile: "প্রোফাইল",
  tabOrders: "অর্ডার",
  tabTracking: "ট্র্যাকিং",
  orderHistory: "অর্ডার হিস্ট্রি",
  viewDetails: "বিস্তারিত",
  trackThis: "ট্র্যাক করুন",
  reorder: "আবার অর্ডার",
  personalInfo: "ব্যক্তিগত তথ্য",
  savedAddresses: "সংরক্ষিত ঠিকানা",
  editProfile: "এডিট",
  defaultLabel: "ডিফল্ট",
  logout: "লগ আউট",
  memberSince: "সদস্য",
  totalOrders: "মোট অর্ডার",
  name: "নাম",
  email: "ইমেইল",
  timelinePlaced: "অর্ডার হয়েছে",
  timelineConfirmed: "নিশ্চিত",
  timelineProcessing: "প্রসেসিং",
  timelineShipped: "পাঠানো হয়েছে",
  timelineDelivered: "ডেলিভারড",
  orderCancelled: "অর্ডার বাতিল",
  cancelOrder: "অর্ডার বাতিল করুন",
  confirmCancelOrder: "এই অর্ডারটি বাতিল করবেন? এটি আর ফেরানো যাবে না।",
  orderItems: "অর্ডারের পণ্য",
  deliveryAddress: "ডেলিভারি ঠিকানা",
  trackParcel: "পার্সেল ট্র্যাক করুন",
  deliveryUpdates: "ডেলিভারি আপডেট",
  paid: "পরিশোধিত",
  viewAllProducts: "সব পণ্য দেখুন",
  darkMode: "ডার্ক",
  lightMode: "লাইট",
  signIn: "সাইন ইন",
  signUp: "সাইন আপ",
  createAccount: "অ্যাকাউন্ট তৈরি করুন",
  signInTitle: "আবার স্বাগতম",
  signInSubtitle: "অর্ডার ট্র্যাক ও দ্রুত চেকআউটের জন্য সাইন ইন করুন।",
  createTitle: "আপনার অ্যাকাউন্ট তৈরি করুন",
  createSubtitle: "পরের বার দ্রুত চেকআউটের জন্য আপনার তথ্য সেভ করুন।",
  password: "পাসওয়ার্ড",
  forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
  paidLabel: "পরিশোধিত",
  dueLabel: "বাকি",
  changePasswordTitle: "পাসওয়ার্ড পরিবর্তন",
  currentPasswordLabel: "বর্তমান পাসওয়ার্ড",
  newPasswordLabel: "নতুন পাসওয়ার্ড",
  confirmPasswordLabel: "নতুন পাসওয়ার্ড নিশ্চিত করুন",
  passwordUpdated: "পাসওয়ার্ড আপডেট হয়েছে",
  passwordMismatch: "পাসওয়ার্ড মিলছে না",
  passwordMin: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে",
  showPassword: "পাসওয়ার্ড দেখান",
  hidePassword: "পাসওয়ার্ড লুকান",
  resetPwTitle: "পাসওয়ার্ড রিসেট করুন",
  resetLinkInvalid: "এই রিসেট লিংকটি অবৈধ বা মেয়াদোত্তীর্ণ।",
  resetLinkSent: "রিসেট লিংক পাঠানো হয়েছে — ইনবক্স দেখুন",
  noAccountPrompt: "নতুন গ্রাহক?",
  haveAccountPrompt: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
  signingIn: "সাইন ইন হচ্ছে…",
  creatingAccount: "অ্যাকাউন্ট তৈরি হচ্ছে…",
  welcomeBack: "আবার স্বাগতম!",
  accountCreated: "অ্যাকাউন্ট তৈরি হয়েছে!",
  staffNotice: "আপনি স্টাফ হিসেবে সাইন ইন করেছেন",
  staffNoticeMsg:
    "এটি আপনার স্টোরের গ্রাহক অংশ। অ্যাডমিন ড্যাশবোর্ড থেকে আপনার স্টোর পরিচালনা করুন — অথবা শপিং অভিজ্ঞতা পরীক্ষা করতে নিচে গ্রাহক হিসেবে সাইন ইন করুন।",
  goToAdmin: "অ্যাডমিন ড্যাশবোর্ডে যান",
  shopAsCustomer: "গ্রাহক হিসেবে কেনাকাটা",
  information: "তথ্য",
  followUs: "আমাদের ফলো করুন",
  footerOrderByPhone: "ফোনে অর্ডার করুন",
  footerNewsletterHeading: "যোগাযোগে থাকুন",
  footerNewsletterBlurb:
    "নতুন পণ্য ও অফার সবার আগে জানুন। সপ্তাহে একটি ইমেইল, তার বেশি নয়।",
  footerSubscribe: "সাবস্ক্রাইব",
  footerEmailPh: "your@email.com",
  footerSubscribed: "আপনি তালিকায় যুক্ত হয়েছেন। ধন্যবাদ!",
  footerSubscribeFailed: "সাবস্ক্রাইব করা যায়নি। আবার চেষ্টা করুন।",
  footerEmailInvalid: "সঠিক ইমেইল ঠিকানা দিন",
};

export const I18N: Record<Lang, Dict> = { en, bn };

/** Status pill labels + colors (light-mode tints; mirror the admin). */
/**
 * One base colour per status; `<StatusPill>` derives the theme-aware text +
 * tint from it with color-mix, so the pills read well in light AND dark.
 */
export const ORDER_STATUS: Record<
  string,
  { en: string; bn: string; c: string }
> = {
  pending: { en: "Pending", bn: "বাকি", c: "#b45309" },
  confirmed: { en: "Confirmed", bn: "নিশ্চিত", c: "#1d4ed8" },
  processing: { en: "Processing", bn: "প্রসেসিং", c: "#6d28d9" },
  shipped: { en: "Shipped", bn: "পাঠানো হয়েছে", c: "#0e7490" },
  delivered: { en: "Delivered", bn: "ডেলিভারড", c: "#15803d" },
  ready_for_pickup: { en: "Ready for pickup", bn: "পিকআপের জন্য প্রস্তুত", c: "#0e7490" },
  picked_up: { en: "Picked up", bn: "সংগ্রহ করা হয়েছে", c: "#15803d" },
  cancelled: { en: "Cancelled", bn: "বাতিল", c: "#b91c1c" },
  returned: { en: "Returned", bn: "ফেরত", c: "#b91c1c" },
  rejected: { en: "Rejected", bn: "বাতিল", c: "#b91c1c" },
};

/**
 * The status wording on the **tracking link** — deliberately plainer than
 * `ORDER_STATUS` above, which is the vocabulary the account view and the admin
 * share ("Processing", "Shipped"). A guest following a link from a merchant has
 * no context for those, so this map answers the only question they have: where is
 * my order. Kept separate for that reason rather than merged into `ORDER_STATUS`.
 */
export const TRACK_STATUS: Record<string, { en: string; bn: string }> = {
  pending: { en: "Order received", bn: "অর্ডার পেয়েছি" },
  confirmed: { en: "Confirmed", bn: "নিশ্চিত হয়েছে" },
  processing: { en: "Being packed", bn: "প্যাক করা হচ্ছে" },
  shipped: { en: "On the way", bn: "পথে আছে" },
  delivered: { en: "Delivered", bn: "ডেলিভারি হয়েছে" },
  ready_for_pickup: { en: "Ready to collect", bn: "সংগ্রহের জন্য প্রস্তুত" },
  picked_up: { en: "Collected", bn: "সংগ্রহ করা হয়েছে" },
  returned: { en: "Returned", bn: "ফেরত গেছে" },
  cancelled: { en: "Cancelled", bn: "বাতিল হয়েছে" },
  rejected: { en: "Not accepted", bn: "গ্রহণ করা হয়নি" },
};

/** Order status pipeline for the tracking timeline. */
export const ORDER_PIPELINE = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
] as const;
