// coding-standard: maintained
import {
  ArrowRightLeft,
  BarChart2,
  Boxes,
  Building2,
  Calendar,
  CalendarClock,
  ClipboardList,
  Clock,
  CornerUpLeft,
  CreditCard,
  Database,
  DownloadCloud,
  Edit,
  FilePlus,
  FileText,
  Globe,
  Grid,
  Home,
  Layers,
  LayoutDashboard,
  List,
  type LucideIcon,
  type LucideProps,
  MapPin,
  Megaphone,
  Package,
  PackageMinus,
  Palette,
  Percent,
  Printer,
  Receipt,
  Repeat,
  ScanBarcode,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sliders,
  Star,
  Store,
  Tag,
  Tags,
  TicketPercent,
  ToggleLeft,
  Truck,
  Undo2,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

/**
 * Static name→icon map for config-driven icons (nav items, reports, feature
 * cards) where the icon name is known at build time. Replaces
 * `lucide-react/dynamic`'s DynamicIcon, which pulls the entire ~1,500-icon
 * registry into the bundle. Only the icons the app's config actually
 * references are imported here — add a new one when a config gains an icon.
 * Same idea as the local map in components/dashboard/stat-card.tsx.
 */
const NAV_ICONS: Record<string, LucideIcon> = {
  "arrow-right-left": ArrowRightLeft,
  "bar-chart-2": BarChart2,
  "building-2": Building2,
  calendar: Calendar,
  "calendar-clock": CalendarClock,
  "clipboard-list": ClipboardList,
  clock: Clock,
  "corner-up-left": CornerUpLeft,
  "credit-card": CreditCard,
  database: Database,
  "download-cloud": DownloadCloud,
  edit: Edit,
  "file-plus": FilePlus,
  "file-text": FileText,
  globe: Globe,
  grid: Grid,
  home: Home,
  layers: Layers,
  "layout-dashboard": LayoutDashboard,
  list: List,
  "map-pin": MapPin,
  megaphone: Megaphone,
  package: Package,
  "package-minus": PackageMinus,
  // Nav config uses "packages" (New Purchase); lucide 0.475 has no `Packages`
  // export and the old DynamicIcon rendered nothing for it — Boxes matches the
  // "multiple packages" intent and restores an icon there.
  packages: Boxes,
  palette: Palette,
  percent: Percent,
  printer: Printer,
  receipt: Receipt,
  repeat: Repeat,
  "scan-barcode": ScanBarcode,
  settings: Settings,
  shield: Shield,
  "shopping-bag": ShoppingBag,
  "shopping-cart": ShoppingCart,
  sliders: Sliders,
  star: Star,
  store: Store,
  tag: Tag,
  tags: Tags,
  "ticket-percent": TicketPercent,
  "toggle-left": ToggleLeft,
  truck: Truck,
  "undo-2": Undo2,
  "user-check": UserCheck,
  users: Users,
  wallet: Wallet,
};

/** Renders a config-driven icon by its kebab-case name; nothing if unmapped. */
export function NavIcon({ name, ...props }: { name?: string } & LucideProps) {
  const Icon = name ? NAV_ICONS[name] : undefined;
  return Icon ? <Icon {...props} /> : null;
}
