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
  account: string;
  cart: string;
  addToCart: string;
  viewAll: string;
  added: string;
  /** Price prefix on variable-product cards: "From ৳400". */
  fromPrice: string;
  /** Card CTA for variable products — options are picked on the PDP. */
  selectOptions: string;
  /** Drawer link to the full /cart page. */
  viewCart: string;
  /** Campaign strip: "«name» — 10% off · Ends 4 Jul". */
  campaignOff: string;
  campaignEnds: string;
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
  prefsTitle: string;
  prefsSub: string;
  promoEmailT: string;
  promoEmailS: string;
  orderSmsT: string;
  orderSmsS: string;
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
  deliverDhaka: string;
  trackOrder: string;
  help: string;
  genuine: string;
  fastDelivery: string;
  codBadge: string;
  eidBadge: string;
  eidSale: string;
  toolsClear: string;
  heroAt: string;
  heroAs: string;
  shopNow: string;
  browseCats: string;
  featured: string;
  shopByCat: string;
  newArrivals: string;
  catGroceries: string;
  catElectronics: string;
  weeklyEdit: string;
  heroBt: string;
  heroBs: string;
  shopWeekly: string;
  trust1t: string;
  trust1s: string;
  trust2t: string;
  trust2s: string;
  trust3t: string;
  trust3s: string;
  weeklyPicks: string;
  promo1: string;
  promo2: string;
  minimalKicker: string;
  heroCt: string;
  heroCs: string;
  startShopping: string;
  selected: string;
  yourCart: string;
  emptyCartMsg: string;
  subtotal: string;
  shipping: string;
  discount: string;
  free: string;
  total: string;
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
  continueWithGoogle: string;
  continueWithFacebook: string;
  oauthSigningIn: string;
  oauthFailed: string;
  oauthCancelled: string;
  checkout: string;
  deliveryDetails: string;
  fullName: string;
  phone: string;
  address: string;
  deliveryZone: string;
  insideDhaka: string;
  outsideDhaka: string;
  paymentMethod: string;
  default: string;
  cod: string;
  bankTransfer: string;
  placeOrder: string;
  orderPlaced: string;
  orderThanks: string;
  orderNo: string;
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
  menu: string;
  allProducts: string;
  results: string;
  sortBy: string;
  sortPopular: string;
  filters: string;
  category: string;
  priceRange: string;
  brandLabel: string;
  clearAll: string;
  applyFilters: string;
  showingOf: string;
  prev: string;
  next: string;
  inStockFilter: string;
  onSale: string;
  inStock: string;
  outOfStock: string;
  addToCartFull: string;
  buyNow: string;
  quantity: string;
  description: string;
  specifications: string;
  relatedTitle: string;
  deliveryEst: string;
  reviewsWord: string;
  skuLabel: string;
  variableTitle: string;
  variableMsg: string;
  callToOrder: string;
  cartTitle: string;
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
  orderItems: string;
  deliveryAddress: string;
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
}

const en: Dict = {
  langTag: "EN",
  langCode: "en-BD",
  langLabel: "English",
  searchPh: "Search products, brands & categories",
  account: "Account",
  cart: "Cart",
  addToCart: "Add to cart",
  fromPrice: "From",
  selectOptions: "Select options",
  viewCart: "View cart",
  campaignOff: "off",
  campaignEnds: "Ends",
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
  prefsTitle: "Notifications",
  prefsSub: "Choose what you want to hear about.",
  promoEmailT: "Promotional emails",
  promoEmailS: "Deals, offers and seasonal sales",
  orderSmsT: "Order updates by SMS",
  orderSmsS: "Delivery and status notifications",
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
  deliverDhaka: "Same-day delivery in Dhaka",
  trackOrder: "Track order",
  help: "Help",
  genuine: "100% authentic",
  fastDelivery: "Same-day delivery",
  codBadge: "Cash on delivery",
  eidBadge: "Eid Sale · 10% off storewide",
  eidSale: "Eid Sale",
  toolsClear: "Tools Clearance",
  heroAt: "Everyday essentials,\ndelivered to your door",
  heroAs: "Groceries, electronics, tools and home needs — one cart, paid your way, delivered across Bangladesh.",
  shopNow: "Shop now",
  browseCats: "Browse categories",
  featured: "Featured products",
  shopByCat: "Shop by category",
  newArrivals: "New arrivals",
  catGroceries: "Groceries",
  catElectronics: "Electronics",
  weeklyEdit: "This week at Rashid’s",
  heroBt: "Stock up\nfor the week",
  heroBs: "A curated weekly basket of essentials — fair prices, authentic brands, no surprises at checkout.",
  shopWeekly: "Shop the basket",
  trust1t: "Free over BDT 2,000",
  trust1s: "On every order",
  trust2t: "Authentic brands",
  trust2s: "Sourced direct",
  trust3t: "Best price",
  trust3s: "Coupons stack-free",
  weeklyPicks: "Weekly picks",
  promo1: "Save 10% on the whole cart this Eid",
  promo2: "Hand & power tools, 15% off",
  minimalKicker: "Rashid’s Mart",
  heroCt: "Less clutter.\nMore essentials.",
  heroCs: "A quieter way to shop the basics — only what you need, delivered when you need it.",
  startShopping: "Start shopping",
  selected: "Selected for you",
  yourCart: "Your cart",
  emptyCartMsg: "Your cart is empty",
  subtotal: "Subtotal",
  shipping: "Shipping",
  discount: "Discount",
  free: "Free",
  total: "Total",
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
  continueWithGoogle: "Continue with Google",
  continueWithFacebook: "Continue with Facebook",
  oauthSigningIn: "Signing you in…",
  oauthFailed: "Sign-in didn't complete. Please try again.",
  oauthCancelled: "Sign-in was cancelled.",
  checkout: "Checkout",
  deliveryDetails: "Delivery details",
  fullName: "Full name",
  phone: "Phone number",
  address: "Full address",
  deliveryZone: "Delivery zone",
  insideDhaka: "Inside Dhaka",
  outsideDhaka: "Outside Dhaka",
  paymentMethod: "Payment method",
  default: "Default",
  cod: "Cash on Delivery",
  bankTransfer: "Bank Transfer",
  placeOrder: "Place order",
  orderPlaced: "Order placed",
  orderThanks: "We’ll send an SMS to confirm your order shortly.",
  orderNo: "Order",
  payStatus: "Payment",
  payStatusPending: "Pending",
  storeInfo: "Your neighbourhood mart, online. Authentic brands, fair prices, delivered across Bangladesh — pay cash on delivery or by bank transfer.",
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
  menu: "Menu",
  allProducts: "All products",
  results: "results",
  sortBy: "Sort",
  sortPopular: "Most popular",
  filters: "Filters",
  category: "Category",
  priceRange: "Price range",
  brandLabel: "Brand",
  clearAll: "Clear all",
  applyFilters: "Apply",
  showingOf: "Showing",
  prev: "Prev",
  next: "Next",
  inStockFilter: "In stock only",
  onSale: "On sale",
  inStock: "In stock",
  outOfStock: "Out of stock",
  addToCartFull: "Add to cart",
  buyNow: "Buy now",
  quantity: "Quantity",
  description: "Description",
  specifications: "Specifications",
  relatedTitle: "You may also like",
  deliveryEst: "Delivery in 1–2 days inside Dhaka",
  reviewsWord: "reviews",
  skuLabel: "SKU",
  variableTitle: "Available in-store only",
  variableMsg: "This product has selectable options (size, bundle) and is not sold online. Visit any Rashid’s Mart outlet or call to order.",
  callToOrder: "Call to order",
  cartTitle: "Shopping cart",
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
  orderItems: "Order items",
  deliveryAddress: "Delivery address",
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
};

const bn: Dict = {
  langTag: "বাংলা",
  langCode: "bn-BD",
  langLabel: "বাংলা",
  searchPh: "পণ্য, ব্র্যান্ড ও ক্যাটাগরি খুঁজুন",
  account: "অ্যাকাউন্ট",
  cart: "কার্ট",
  addToCart: "কার্টে যোগ করুন",
  fromPrice: "শুরু",
  selectOptions: "ভ্যারিয়েন্ট বাছাই করুন",
  viewCart: "কার্ট দেখুন",
  campaignOff: "ছাড়",
  campaignEnds: "শেষ",
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
  prefsTitle: "নোটিফিকেশন",
  prefsSub: "আপনি কী জানতে চান তা বেছে নিন।",
  promoEmailT: "প্রোমোশনাল ইমেইল",
  promoEmailS: "ডিল, অফার ও সিজনাল সেল",
  orderSmsT: "এসএমএসে অর্ডার আপডেট",
  orderSmsS: "ডেলিভারি ও স্ট্যাটাস নোটিফিকেশন",
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
  deliverDhaka: "ঢাকায় একই দিনে ডেলিভারি",
  trackOrder: "অর্ডার ট্র্যাক",
  help: "সহায়তা",
  genuine: "১০০% আসল",
  fastDelivery: "একই দিনে ডেলিভারি",
  codBadge: "ক্যাশ অন ডেলিভারি",
  eidBadge: "ঈদ সেল · সব পণ্যে ১০% ছাড়",
  eidSale: "ঈদ সেল",
  toolsClear: "টুলস ক্লিয়ারেন্স",
  heroAt: "প্রতিদিনের প্রয়োজন,\nআপনার দরজায়",
  heroAs: "মুদি, ইলেকট্রনিক্স, টুলস ও হোম পণ্য — এক কার্টে, পছন্দমতো পেমেন্টে, সারা বাংলাদেশে ডেলিভারি।",
  shopNow: "কিনুন",
  browseCats: "ক্যাটাগরি দেখুন",
  featured: "ফিচার্ড পণ্য",
  shopByCat: "ক্যাটাগরি অনুযায়ী",
  newArrivals: "নতুন এসেছে",
  catGroceries: "মুদি",
  catElectronics: "ইলেকট্রনিক্স",
  weeklyEdit: "এই সপ্তাহে রশিদ’স",
  heroBt: "সপ্তাহের জন্য\nস্টক করুন",
  heroBs: "প্রতি সপ্তাহের বাছাই করা প্রয়োজনীয় ঝুড়ি — সঠিক দাম, আসল ব্র্যান্ড, চেকআউটে কোনো চমক নেই।",
  shopWeekly: "ঝুড়ি দেখুন",
  trust1t: "২,০০০ টাকার বেশি অর্ডারে ফ্রি",
  trust1s: "প্রতিটি অর্ডারে",
  trust2t: "আসল ব্র্যান্ড",
  trust2s: "সরাসরি সংগ্রহ",
  trust3t: "সেরা দাম",
  trust3s: "কুপন একক প্রযোজ্য",
  weeklyPicks: "সাপ্তাহিক পছন্দ",
  promo1: "এই ঈদে পুরো কার্টে ১০% ছাড়",
  promo2: "হ্যান্ড ও পাওয়ার টুলসে ১৫% ছাড়",
  minimalKicker: "রশিদ’স মার্ট",
  heroCt: "কম ভিড়।\nবেশি প্রয়োজন।",
  heroCs: "প্রয়োজনীয় জিনিস কেনার সহজ উপায় — যা দরকার শুধু তাই, সময়মতো ডেলিভারি।",
  startShopping: "কেনাকাটা শুরু",
  selected: "আপনার জন্য বাছাই",
  yourCart: "আপনার কার্ট",
  emptyCartMsg: "আপনার কার্ট খালি",
  subtotal: "সাবটোটাল",
  shipping: "শিপিং",
  discount: "ছাড়",
  free: "ফ্রি",
  total: "মোট",
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
  continueWithGoogle: "Google দিয়ে চালিয়ে যান",
  continueWithFacebook: "Facebook দিয়ে চালিয়ে যান",
  oauthSigningIn: "সাইন ইন করা হচ্ছে…",
  oauthFailed: "সাইন-ইন সম্পন্ন হয়নি। আবার চেষ্টা করুন।",
  oauthCancelled: "সাইন-ইন বাতিল করা হয়েছে।",
  checkout: "চেকআউট",
  deliveryDetails: "ডেলিভারি তথ্য",
  fullName: "পুরো নাম",
  phone: "ফোন নম্বর",
  address: "সম্পূর্ণ ঠিকানা",
  deliveryZone: "ডেলিভারি জোন",
  insideDhaka: "ঢাকার ভিতরে",
  outsideDhaka: "ঢাকার বাইরে",
  paymentMethod: "পেমেন্ট মাধ্যম",
  default: "ডিফল্ট",
  cod: "ক্যাশ অন ডেলিভারি",
  bankTransfer: "ব্যাংক ট্রান্সফার",
  placeOrder: "অর্ডার করুন",
  orderPlaced: "অর্ডার সম্পন্ন",
  orderThanks: "অর্ডার নিশ্চিত করতে শীঘ্রই এসএমএস পাঠানো হবে।",
  orderNo: "অর্ডার",
  payStatus: "পেমেন্ট",
  payStatusPending: "বাকি",
  storeInfo: "আপনার পাড়ার মার্ট, অনলাইনে। আসল ব্র্যান্ড, সঠিক দাম, সারা বাংলাদেশে ডেলিভারি — ক্যাশ অন ডেলিভারি বা ব্যাংক ট্রান্সফারে পেমেন্ট।",
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
  menu: "মেনু",
  allProducts: "সব পণ্য",
  results: "ফলাফল",
  sortBy: "সাজান",
  sortPopular: "জনপ্রিয়",
  filters: "ফিল্টার",
  category: "ক্যাটাগরি",
  priceRange: "দামের পরিসীমা",
  brandLabel: "ব্র্যান্ড",
  clearAll: "সব মুছুন",
  applyFilters: "প্রয়োগ",
  showingOf: "দেখাচ্ছে",
  prev: "আগের",
  next: "পরের",
  inStockFilter: "শুধু স্টকে আছে",
  onSale: "ছাড়ে",
  inStock: "স্টকে আছে",
  outOfStock: "স্টকে নেই",
  addToCartFull: "কার্টে যোগ করুন",
  buyNow: "এখনই কিনুন",
  quantity: "পরিমাণ",
  description: "বিবরণ",
  specifications: "স্পেসিফিকেশন",
  relatedTitle: "আরও পছন্দ হতে পারে",
  deliveryEst: "ঢাকার ভিতরে ১–২ দিনে ডেলিভারি",
  reviewsWord: "রিভিউ",
  skuLabel: "এসকেইউ",
  variableTitle: "শুধু দোকানে পাওয়া যায়",
  variableMsg: "এই পণ্যে নির্বাচনযোগ্য অপশন (সাইজ, বান্ডেল) আছে এবং অনলাইনে বিক্রি হয় না। যেকোনো রশিদ’স মার্ট আউটলেটে যান বা কল করে অর্ডার করুন।",
  callToOrder: "কল করে অর্ডার",
  cartTitle: "শপিং কার্ট",
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
  orderItems: "অর্ডারের পণ্য",
  deliveryAddress: "ডেলিভারি ঠিকানা",
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
};

export const I18N: Record<Lang, Dict> = { en, bn };

/** Status pill labels + colors (light-mode tints; mirror the admin). */
export const ORDER_STATUS: Record<
  string,
  { en: string; bn: string; c: string; bg: string }
> = {
  pending: { en: "Pending", bn: "বাকি", c: "#b45309", bg: "#fef3c7" },
  confirmed: { en: "Confirmed", bn: "নিশ্চিত", c: "#1d4ed8", bg: "#dbeafe" },
  processing: { en: "Processing", bn: "প্রসেসিং", c: "#6d28d9", bg: "#ede9fe" },
  shipped: { en: "Shipped", bn: "পাঠানো হয়েছে", c: "#0e7490", bg: "#cffafe" },
  delivered: { en: "Delivered", bn: "ডেলিভারড", c: "#15803d", bg: "#dcfce7" },
  cancelled: { en: "Cancelled", bn: "বাতিল", c: "#b91c1c", bg: "#fee2e2" },
  returned: { en: "Returned", bn: "ফেরত", c: "#b91c1c", bg: "#fee2e2" },
  rejected: { en: "Rejected", bn: "বাতিল", c: "#b91c1c", bg: "#fee2e2" },
};

/** Order status pipeline for the tracking timeline. */
export const ORDER_PIPELINE = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
] as const;
