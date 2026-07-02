"use client";

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
}

export function ProductSearch({ onSelect, placeholder = "Search products by name or category..." }: ProductSearchProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useSelectOptions("/inventory/sellable-products", productItemsCreateCallback);

  const castProducts = products as unknown as ExtractedProduct[];

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
              placeholder={placeholder}
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
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading products...
              </div>
            ) : (
              <>
                <CommandEmpty className="p-2">No products found</CommandEmpty>
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
