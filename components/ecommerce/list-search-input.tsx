"use client";
// coding-standard: maintained

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/ui/components/input";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { cn } from "@/ui/lib/utils";

interface ListSearchInputProps {
  placeholder: string;
  /** Called with the trimmed value 300ms after typing stops. The caller owns
   *  any reset side effects (page 1, clearing row selection). */
  onSearch: (value: string) => void;
  className?: string;
}

/** Debounced search box shared by the hand-rolled ecommerce list pages
 *  (orders, customers, catalog). */
export function ListSearchInput({
  placeholder,
  onSearch,
  className,
}: ListSearchInputProps) {
  const [text, setText] = useState("");
  const commit = useDebouncedCallback(
    (value: string) => onSearch(value.trim()),
    300,
  );

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        placeholder={placeholder}
        className="h-9 w-64 pl-8"
      />
    </div>
  );
}
