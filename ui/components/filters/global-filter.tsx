"use client";

import React from 'react';
import { FilterConfig, FilterField } from '@/types/filter';
import { useFilters } from '@/hooks/use-filters';
import { Button } from '@ui/components/button';
import { Badge } from '@ui/components/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@ui/components/sheet';
import { Filter, X } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { FilterFieldRenderer } from './filter-field-renderer';

interface GlobalFilterProps {
  config: FilterConfig;
  trigger?: React.ReactNode;
}

export function GlobalFilter({ config, trigger }: GlobalFilterProps) {
  const {
    fields,
    columns = 2,
    applyOnChange = false,
    showResetButton = true,
    showApplyButton = true,
    onApply,
    onReset,
  } = config;

  const {
    values,
    updateField,
    apply,
    reset,
    activeCount,
    isOpen,
    setIsOpen,
  } = useFilters(fields, onApply, applyOnChange);

  const handleReset = () => {
    reset();
    onReset?.();
  };

  const handleApply = () => {
    apply();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-1 rounded-full px-2">
                {activeCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Options</SheetTitle>
          <SheetDescription>
            Apply filters to refine your results
          </SheetDescription>
        </SheetHeader>

        {/* Active Filters Summary */}
        {/* {activeCount > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(values).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
              
              const field = fields.find(f => f.name === key);
              if (!field) return null;

              return (
                <Badge key={key} variant="secondary" className="gap-1">
                  <span className="font-semibold">{field.label}:</span>
                  <span className="text-muted-foreground">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                  <button
                    onClick={() => clearField(key)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )} */}

        {/* Filter Fields */}
        <div
          className={cn(
            "mx-4 mt-6 grid gap-6 px-1",
            columns === 1 && "grid-cols-1",
            columns === 2 && "grid-cols-1 sm:grid-cols-2",
            columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          )}
        >
          {fields.map((field) => {
            // Check conditional visibility
            if (field.showWhen && !field.showWhen(values)) {
              return null;
            }

            return (
              <div
                key={field.name}
                className={cn(
                  field.columnSpan === 2 && "sm:col-span-2",
                  field.columnSpan === 3 && "lg:col-span-3",
                  field.columnSpan === 4 && "lg:col-span-4"
                )}
              >
                <FilterFieldRenderer
                  field={field}
                  value={values[field.name]}
                  onChange={(value) => updateField(field.name, value)}
                />
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <SheetFooter className="mt-6 gap-2 flex-col sm:flex-row sm:justify-end">
          {showResetButton && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={activeCount === 0}
              className="w-full sm:w-auto"
            >
              Reset All
            </Button>
          )}
          {showApplyButton && !applyOnChange && (
            <Button onClick={handleApply} className="w-full sm:w-auto">
              Apply Filters
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
