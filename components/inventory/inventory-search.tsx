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
import { Package, Search, ArrowLeftRight } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { fromBaseUnit, formatQuantity } from "@/utils/uom-conversion";
import Fuse from "fuse.js";
import type { SelectOption } from "@/ui/components/form/type";

export interface InventoryProduct {
  value: string;       // inventoryId
  label: string;       // product name (includes variant details)
  price: number;
  costPrice: number;
  quantity: number;     // current stock quantity (base units)
  productId: string;
  variantId: string | null;
  // UOM conversion fields (only present when product has UOM enabled)
  enableUOMConversion?: boolean;
  conversionFactor?: number;
  purchaseUnitName?: string;
  baseUnitName?: string;
  // Expiry tracking: true when the product captures expiry batches
  hasExpiry?: boolean;
}

/**
 * Transform API response for adjustable products
 */
export const adjustableProductsCallback = (response: any): SelectOption[] => {
  const items = response?.data || [];
  return items.map((item: any) => ({
    value: item._id,
    label: item.name,
    price: item.price,
    costPrice: item.costPrice,
    quantity: item.quantity,
    productId: item.productId,
    variantId: item.variantId,
    hasExpiry: !!item.hasExpiry,
    // UOM conversion data
    ...(item.enableUOMConversion ? {
      enableUOMConversion: true,
      conversionFactor: item.conversionFactor,
      purchaseUnitName: item.purchaseUnitName,
      baseUnitName: item.baseUnitName,
    } : {}),
  })) as SelectOption[];
};

interface InventorySearchProps {
  onSelect: (product: InventoryProduct) => void;
  placeholder?: string;
  excludeIds?: string[];
  apiUrl?: string;
}

export function InventorySearch({
  onSelect,
  placeholder = "Search products by name or category...",
  excludeIds = [],
  apiUrl,
}: InventorySearchProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useSelectOptions(
    apiUrl || "/inventory/adjustable-products",
    adjustableProductsCallback
  );

  const castProducts = products as unknown as InventoryProduct[];

  // Filter out already-added items
  const availableProducts = useMemo(
    () => castProducts.filter((p) => !excludeIds.includes(p.value)),
    [castProducts, excludeIds]
  );

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(availableProducts, {
        keys: ["label"],
        threshold: 0.4,
        distance: 100,
        minMatchCharLength: 1,
      }),
    [availableProducts]
  );

  // Fuzzy-filtered results
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return availableProducts;
    return fuse.search(search).map((result) => result.item);
  }, [search, fuse, availableProducts]);

  const handleSelect = useCallback(
    (productValue: string) => {
      const product = castProducts.find((p) => p.value === productValue);
      if (product) {
        onSelect(product);
        setSearch("");
        setIsOpen(false);
      }
    },
    [onSelect, castProducts]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Command shouldFilter={false} className="overflow-visible bg-transparent">
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
              className="pl-9 h-11"
            />
          </div>
        </PopoverAnchor>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => {
            if (inputRef.current && inputRef.current.contains(e.target as Node)) {
              e.preventDefault();
            }
          }}
        >
          <CommandList>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading inventory...
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
                        <div className="font-medium text-sm">{product.label}</div>
                        {product.enableUOMConversion && product.conversionFactor && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <ArrowLeftRight className="h-3 w-3" />
                            <span>
                              1 {product.purchaseUnitName} = {product.conversionFactor} {product.baseUnitName}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-medium text-sm">
                          {formatCurrency(product.price || 0)}
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            product.quantity === 0
                              ? "text-red-500"
                              : product.quantity <= 5
                                ? "text-red-500"
                                : product.quantity <= 20
                                  ? "text-orange-500"
                                  : "text-green-600"
                          }`}
                        >
                          {product.quantity}{product.baseUnitName ? ` ${product.baseUnitName}` : ''} in stock
                          {product.enableUOMConversion && product.conversionFactor
                            ? ` (≈${formatQuantity(fromBaseUnit(product.quantity, product.conversionFactor))} ${product.purchaseUnitName})`
                            : ''
                          }
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
