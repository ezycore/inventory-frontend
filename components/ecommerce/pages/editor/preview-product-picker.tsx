"use client";
// coding-standard: maintained

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { CatalogProduct } from "@/lib/storefront-client";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/components/popover";
import { cn } from "@/ui/lib/utils";
import { previewSuggestions, type PreviewReason } from "./preview-suggestions";
import { usePreviewProducts } from "./use-preview-product";

/**
 * Which product the editor draws the shared product page around.
 *
 * One page serves every product, so a merchant judging it on the store's first
 * product only ever sees that product's shape. The picker leads with the products
 * that draw what the first one may not — options, a long description, sold out
 * (`previewSuggestions`) — and searches the rest by name.
 *
 * `products` is the unfiltered list the editor already holds; a search fetches
 * its own, only while the picker is open.
 */
export function PreviewProductPicker({
  slug,
  products,
  value,
  onChange,
}: {
  slug?: string;
  products: CatalogProduct[];
  value: CatalogProduct;
  onChange: (product: CatalogProduct) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const term = useDebounce(query.trim(), 300);
  const search = usePreviewProducts(slug, open && term !== "", term);

  const suggestions = term ? [] : previewSuggestions(products);
  const suggested = new Set(suggestions.map(({ product }) => product._id));
  const listed = term ? (search.data ?? []) : products.filter((product) => !suggested.has(product._id));
  const searching = term !== "" && search.isPending;

  const pick = (product: CatalogProduct) => {
    onChange(product);
    setOpen(false);
    setQuery("");
  };
  const item = (product: CatalogProduct, reason?: PreviewReason) => (
    <CommandItem key={product._id} value={product._id} onSelect={() => pick(product)} className="gap-2">
      <span className="min-w-0 flex-1 truncate">{product.name}</span>
      {reason ? (
        <Badge variant="secondary" className="shrink-0 font-normal">
          {reason}
        </Badge>
      ) : null}
      <Check className={cn("h-4 w-4 shrink-0", product.slug === value.slug ? "opacity-100" : "opacity-0")} />
    </CommandItem>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Previewing ${value.name}. Choose another product`}
          className="h-8 max-w-[16rem] gap-1.5 bg-background px-2.5 font-normal"
        >
          <span className="hidden text-muted-foreground sm:inline">Previewing</span>
          <span className="min-w-0 truncate font-medium">{value.name}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search your products" />
          <CommandList>
            {searching ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Searching…</p>
            ) : (
              <CommandEmpty>No products match.</CommandEmpty>
            )}
            {suggestions.length > 0 ? (
              <CommandGroup heading="Good for checking">
                {suggestions.map(({ product, reason }) => item(product, reason))}
              </CommandGroup>
            ) : null}
            {!searching && listed.length > 0 ? (
              <CommandGroup heading={term ? "Matches" : "All products"}>
                {listed.map((product) => item(product))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
