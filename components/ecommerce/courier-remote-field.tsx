"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Spinner } from "@/ui/components/spinner";

/**
 * A credential field whose value is chosen from a list the provider serves on
 * demand (Pathao pickup stores, eCourier packages): a "Load" button fetches the
 * options, then the field becomes a dropdown. Falls back to a plain input +
 * button until the list is loaded, so a hand-typed value still works.
 */
export function CourierRemoteField({
  id,
  value,
  onChange,
  onLoad,
  loading,
  options,
  placeholder,
  loadLabel,
  icon,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onLoad: () => void;
  loading: boolean;
  options: { label: string; value: string }[];
  placeholder: string;
  loadLabel: string;
  icon: ReactNode;
}) {
  if (options.length > 0) {
    return (
      <SimpleSelect
        id={id}
        value={value}
        onValueChange={onChange}
        placeholder={placeholder}
        options={options}
      />
    );
  }
  return (
    <div className="flex gap-2">
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        onClick={onLoad}
        disabled={loading}
        className="shrink-0"
      >
        {loading ? <Spinner /> : icon}
        {loadLabel}
      </Button>
    </div>
  );
}
