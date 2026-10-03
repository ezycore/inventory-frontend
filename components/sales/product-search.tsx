"use client";
// coding-standard: maintained
import { selectOptions } from "@/services/api/select-options";
import { useTranslations } from "next-intl";
import { useSelectOptions } from "@/services/api";
import { formatCurrency } from "@/lib/currency";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/ui/components/command";
import { Popover, PopoverAnchor, PopoverContent } from "@/ui/components/popover";
import { Input } from "@/ui/components/input";
import { Package, ScanBarcode, Search } from "lucide-react";
import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import Fuse from "fuse.js";
import { useKeyboardWedgeScan } from "@/hooks/use-keyboard-wedge-scan";
import { toWestern } from "@/lib/parse-bd-address";
import { cn } from "@ui/lib/utils";
import { productItemsCreateCallback } from "./helpers";
import { ProductThumb } from "./product-thumb";
import { ExtractedProduct } from "./types";

interface SellableProduct {
  value: string;
  label: string;
  costPrice: number;
  price: number;
  availableQuantity: number;
  /** `false` when the org keeps no stock — see `ExtractedProduct.tracked`. */
  tracked?: boolean;
  productId: string;
  variantId: string | null;
}

interface ProductSearchProps {
  onSelect: (product: ExtractedProduct) => void;
  placeholder?: string;
  /**
   * Override the catalogue this picker searches.
   *
   * Default (absent) is the **POS** sellable-products list, priced at
   * `product.price` — correct at the counter and nowhere else. The ecommerce
   * create-order dialog passes its own storefront-priced, campaign-applied rows,
   * because a chat order is charged `storefront.onlinePrice ?? price` and may
   * only contain products the storefront order path accepts.
   *
   * Supplying this **skips the POS fetch entirely**; pass `loading` yourself.
   */
  source?: ExtractedProduct[];
  loading?: boolean;
  /**
   * Make this ONE box for scanning and searching (the POS counter). A
   * keyboard-wedge scanner's burst ending in Enter calls `onScan(code)` instead
   * of picking from the list, and so does Enter on typed text that matches
   * nothing — a barcode keyed in by hand. A barcode typed in full lists its
   * product as the only result.
   */
  onScan?: (code: string) => void;
  /** productId → photo URL. When set, rows show the photo instead of the box icon. */
  thumbnails?: Map<string, string>;
  /** `lg` for the counter: a taller box for a touch screen and a scanner. */
  size?: "default" | "lg";
  /** Lets the caller focus the box (the POS F2 shortcut). */
  inputRef?: RefObject<HTMLInputElement | null>;
  /**
   * Whether focusing the empty box lists every product (default). The POS
   * passes `false`: it focuses the box on arrival and after every scan, and has
   * its own Browse tab — there the list opens only once the cashier types.
   */
  openOnFocus?: boolean;
}

export function ProductSearch({
  onSelect,
  placeholder,
  source,
  loading,
  onScan,
  thumbnails,
  size = "default",
  inputRef: externalRef,
  openOnFocus = true,
}: ProductSearchProps) {
  const t = useTranslations("sales.sell.search");
  const resolvedPlaceholder = placeholder ?? t("products");
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const ownRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? ownRef;
  const scan = useKeyboardWedgeScan();

  // A `null` url short-circuits the query, so a caller supplying `source` never
  // pays for the POS list it is not going to show.
  const { data: products = [], isLoading } = useSelectOptions(
    source ? null : selectOptions("sellableProducts"),
    productItemsCreateCallback,
  );

  const castProducts = (source ??
    (products as unknown as ExtractedProduct[])) as ExtractedProduct[];

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(castProducts, {
        keys: ["label"],
        threshold: 0.4, // 0 = exact, 1 = match anything — 0.4 is a good balance
        distance: 100,
        minMatchCharLength: 1,
      }),
    [castProducts],
  );

  // Fuzzy-filtered results. In scan mode a full barcode is an exact hit, not
  // a fuzzy one — digits fuzzy-match half the catalogue.
  const filteredProducts = useMemo(() => {
    const term = search.trim();
    if (!term) return castProducts;
    if (onScan) {
      // With Avro/Bijoy on, a scanner "types" Bangla digits (৮৯০…).
      const code = toWestern(term);
      const exact = castProducts.filter((p) => p.barcode === code);
      if (exact.length) return exact;
    }
    return fuse.search(term).map((result) => result.item);
  }, [search, fuse, castProducts, onScan]);

  const handleSelect = useCallback(
    (productValue: string) => {
      const product = castProducts.find((p) => p.value === productValue);
      if (product) {
        onSelect(product);
        setSearch("");
        setIsOpen(false);
      }
    },
    [onSelect, castProducts],
  );

  // The highlighted row, which Enter picks. Kept on a row that is still in the
  // list: cmdk only re-highlights when its own <CommandInput> types, and this
  // box is a plain input, so narrowing the results ("i" → "insulin") left the
  // highlight on a row that had been filtered out and Enter did nothing. The
  // arrow keys still move it (`onValueChange`).
  const [active, setActive] = useState("");
  const activeValue = filteredProducts.some((p) => p.value === active)
    ? active
    : (filteredProducts[0]?.value ?? "");

  const submitScan = useCallback(
    (code: string) => {
      onScan?.(code);
      setSearch("");
      setIsOpen(false);
      scan.reset();
    },
    [onScan, scan],
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Command
        shouldFilter={false}
        value={activeValue}
        onValueChange={setActive}
        className="overflow-visible bg-transparent"
      >
        <PopoverAnchor asChild>
          <div className="relative">
            {onScan ? (
              <ScanBarcode className={cn("absolute left-3 top-1/2 -translate-y-1/2 text-primary", size === "lg" ? "h-5 w-5" : "h-4 w-4")} />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => {
                if (openOnFocus || search.trim()) setIsOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsOpen(false);
                  inputRef.current?.blur();
                  return;
                }
                if (!onScan) return;
                const term = search.trim();
                // Ahead of the list's own Enter (it bubbles to `Command`
                // next): a scanner burst or an unmatched code is a barcode,
                // not a pick from the list.
                if (
                  e.key === "Enter" &&
                  term &&
                  (scan.isScan() || filteredProducts.length === 0)
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                  submitScan(toWestern(term));
                  return;
                }
                scan.track(e.key);
              }}
              placeholder={resolvedPlaceholder}
              autoComplete="off"
              spellCheck={false}
              className={cn(size === "lg" ? "h-12 pl-11 text-base" : "pl-9")}
            />
          </div>
        </PopoverAnchor>

        <PopoverContent
          className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] p-0"
          align="start"
          sideOffset={4}
          // Not portalled, so the results list stays inside whatever dialog is
          // hosting this picker. The ecommerce create-order dialog is one, and a
          // portalled list there is outside the dialog's scroll lock, which
          // cancels every wheel event over it — the list could only be scrolled
          // by dragging its scrollbar. See the prop's note in `popover.tsx`.
          portal={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            // Don't close if clicking the input
            if (
              inputRef.current &&
              inputRef.current.contains(e.target as Node)
            ) {
              e.preventDefault();
            }
          }}
        >
          <CommandList>
            {(source ? loading : isLoading) ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading products...
              </div>
            ) : (
              <>
                <CommandEmpty className="p-2">{t("noProducts")}</CommandEmpty>
                <CommandGroup>
                  {filteredProducts.map((product) => (
                    <CommandItem
                      key={product.value}
                      value={product.value}
                      onSelect={handleSelect}
                      className="flex items-center gap-3 px-3 py-2.5"
                    >
                      {thumbnails ? (
                        <ProductThumb src={thumbnails.get(product.productId)} />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 font-medium text-sm break-words">
                            {product.label}
                          </span>
                          {product.isCombo && (
                            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                              Combo
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-medium text-sm">
                          {/* `compareAt` is set only when a campaign actually
                              lowered this row, so the struck "was" appears on a
                              discounted product and nowhere else. The POS list
                              never sets it. */}
                          {product.compareAt ? (
                            <span className="mr-1.5 text-xs font-normal text-muted-foreground line-through">
                              {formatCurrency(product.compareAt)}
                            </span>
                          ) : null}
                          {formatCurrency(product.price || 0)}
                        </div>
                        {/*
                          Nothing at all for a workspace that keeps no stock.

                          `availableQuantity` is `UNTRACKED_AVAILABLE_QUANTITY`
                          there, and the sentinel is designed to satisfy every
                          `> 0` test downstream unchanged — which it does. This
                          row is the exception, because it PRINTS the number:
                          the thresholds below all fall to "plenty" and the line
                          reads "9007199254740991 in stock".

                          Hidden rather than replaced with "In stock": an
                          untracked shop has no availability to report, and a
                          reassuring label would be a claim about stock rather
                          than the absence of one.
                        */}
                        {product.tracked !== false && (
                        <div
                          className={`text-xs font-medium ${product.availableQuantity <= 5
                            ? "text-red-500"
                            : product.availableQuantity <= 20
                              ? "text-orange-500"
                              : "text-green-600"
                            }`}
                        >
                          {product.availableQuantity} in stock
                        </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </PopoverContent>
      </Command>
    </Popover>
  );
}
