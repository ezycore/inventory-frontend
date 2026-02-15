"use client";

import { useSelectOptions } from "@/services/api";
import { formatCurrency } from "@/lib/currency";
import { Input } from "@/ui/components/input";
import { Package, Search } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { productItemsCreateCallback } from "./helpers";

interface SellableProduct {
  value: string;
  label: string;
  costPrice: number;
  unitPrice: number;
  availableQuantity: number;
  productId: string;
  variantId: string | null;
}

interface ProductSearchProps {
  onSelect: (product: SellableProduct) => void;
  placeholder?: string;
}

export function ProductSearch({
  onSelect,
  placeholder = "Search products by name or category...",
}: ProductSearchProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useSelectOptions(
    "/inventory/sellable-products",
    productItemsCreateCallback,
  );

  const filteredProducts = (
    search.trim()
      ? products.filter((p) =>
          p.label.toLowerCase().includes(search.toLowerCase()),
        )
      : products
  ) as unknown as SellableProduct[];

  const handleSelect = useCallback(
    (product: SellableProduct) => {
      onSelect(product);
      setSearch("");
      setIsOpen(false);
    },
    [onSelect],
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No products found
            </div>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.value}
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors text-left border-b last:border-b-0"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(product)}
              >
                <Package className="h-5 w-5 text-muted-foreground/50 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{product.label}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-medium text-sm">
                    {formatCurrency(product.unitPrice || 0)}
                  </div>
                  <div
                    className={`text-xs font-medium ${
                      product.availableQuantity <= 5
                        ? "text-red-500"
                        : product.availableQuantity <= 20
                          ? "text-orange-500"
                          : "text-green-600"
                    }`}
                  >
                    {product.availableQuantity} in stock
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
