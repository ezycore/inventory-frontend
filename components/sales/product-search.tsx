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
import { Package, Search } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { productItemsCreateCallback } from "./helpers";
import { ExtractedProduct } from "./types";

interface SellableProduct {
  value: string;
  label: string;
  costPrice: number;
  price: number;
  availableQuantity: number;
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
}

export function ProductSearch({
  onSelect,
  placeholder,
  source,
  loading,
}: ProductSearchProps) {
  const t = useTranslations("sales.sell.search");
  const resolvedPlaceholder = placeholder ?? t("products");
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Fuzzy-filtered results
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return castProducts;
    return fuse.search(search).map((result) => result.item);
  }, [search, fuse, castProducts]);

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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Command
        shouldFilter={false}
        className="overflow-visible bg-transparent"
      >
        <PopoverAnchor asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsOpen(false);
                  inputRef.current?.blur();
                }
              }}
              placeholder={resolvedPlaceholder}
              className="pl-9"
            />
          </div>
        </PopoverAnchor>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          sideOffset={4}
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
                      <Package className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
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
