"use client";

import React from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@ui/components/popover';
import { Filter, X } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { FilterFieldRenderer } from './filter-field-renderer';
import { FilterConfig } from '@/types/DataTable';

interface GlobalFilterProps {
  config: FilterConfig;
  trigger?: React.ReactNode;
}

export function  GlobalFilter({ config, trigger }: GlobalFilterProps) {
  const {
    fields,
    columns = 2,
    viewMode = 'sheet',
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

  const triggerButton = trigger || (
    <Button variant="outline" className="gap-2">
      <Filter className="h-4 w-4" />
      Filters
      {activeCount > 0 && (
        <Badge variant="secondary" className="ml-1 rounded-full px-2">
          {activeCount}
        </Badge>
      )}
    </Button>
  );

  const filterContent = (
    <>

      {/* Filter Fields */}
      <div
        className={cn(
          "grid gap-6 px-1",
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
      <div className={cn(
        "mt-6 gap-2 flex",
        viewMode === 'sheet' ? 'flex-col sm:flex-row sm:justify-end' : 'flex-row justify-end'
      )}>
        {showResetButton && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={activeCount === 0}
            className={viewMode === 'sheet' ? 'w-full sm:w-auto' : 'w-auto'}
          >
            Reset All
          </Button>
        )}
        {showApplyButton && !applyOnChange && (
          <Button onClick={handleApply} className={viewMode === 'sheet' ? 'w-full sm:w-auto' : 'w-auto'}>
            Apply Filters
          </Button>
        )}
      </div>
    </>
  );

  if (viewMode === 'popover') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {triggerButton}
        </PopoverTrigger>
        <PopoverContent className="w-[600px] max-w-[95vw] p-6 mr-6" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-1">Filter Options</h4>
              <p className="text-sm text-muted-foreground">Apply filters to refine your results</p>
            </div>
            {filterContent}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {triggerButton}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Options</SheetTitle>
          <SheetDescription>
            Apply filters to refine your results
          </SheetDescription>
        </SheetHeader>
        <div className="mx-4 mt-6">
          {filterContent}
        </div>
      </SheetContent>
    </Sheet>
  );
}
