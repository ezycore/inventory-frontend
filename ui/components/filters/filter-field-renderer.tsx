"use client";

import { FilterField } from '@/types/filter';
import { Input } from '@ui/components/input';
import { NumberField } from '@ui/components/number-field';
import { Label } from '@ui/components/label';
import { AdvancedSelect } from '@ui/components/advanced-select';
import { Checkbox } from '@ui/components/checkbox';
import { DatePicker } from '@ui/components/date-picker';
import { DateRangePicker } from '@ui/components/date-range-picker';

interface FilterFieldRendererProps {
  field: FilterField;
  value: any;
  onChange: (value: any) => void;
}

export function FilterFieldRenderer({
  field,
  value,
  onChange,
}: FilterFieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        );

      case 'number':
        return (
          <NumberField
            placeholder={field.placeholder}
            value={value === '' || value == null ? null : Number(value)}
            onChange={(v) => onChange(v ?? '')}
            min={field.min}
            max={field.max}
          />
        );

      case 'select':
        // Convert FilterOption[] to SelectOption[] format
        const selectOptions = field.options?.map((option) => ({
          label: option.label,
          value: String(option.value),
          disabled: false,
        })) || [];

        return (
          <AdvancedSelect
            mode="single"
            value={value ? String(value) : ''}
            onValueChange={onChange}
            placeholder={field.placeholder || 'Select...'}
            options={selectOptions}
            optionsApi={field.optionsApi}
          />
        );

      case 'checkbox':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.map((option) => {
              const isChecked = selectedValues.includes(option.value);
              return (
                <div key={String(option.value)} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.name}-${option.value}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onChange([...selectedValues, option.value]);
                      } else {
                        onChange(selectedValues.filter((v) => v !== option.value));
                      }
                    }}
                  />
                  <label
                    htmlFor={`${field.name}-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              );
            })}
          </div>
        );

      case 'number-range':
        return (
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              placeholder="Min"
              value={value?.min ?? null}
              onChange={(v) => onChange({ ...value, min: v ?? undefined })}
              min={field.min}
            />
            <NumberField
              placeholder="Max"
              value={value?.max ?? null}
              onChange={(v) => onChange({ ...value, max: v ?? undefined })}
              max={field.max}
            />
          </div>
        );

      case 'date':
        return (
          <DatePicker
            date={value ? new Date(value) : null}
            onSelect={(date) => onChange(date ? new Date(date).toLocaleDateString('en-CA') : undefined)}
            placeholder={field.placeholder || 'Select date'}
          />
        );

      case 'date-range':
        return (
          <DateRangePicker
            value={
              value?.from || value?.to
                ? {
                    from: value.from ? new Date(value.from) : undefined,
                    to: value.to ? new Date(value.to) : undefined,
                  }
                : undefined
            }
            onChange={(range) =>
              onChange(
                range?.from || range?.to
                  ? {
                      from: range.from?.toLocaleDateString('en-CA'),
                      to: range.to?.toLocaleDateString('en-CA'),
                    }
                  : undefined
              )
            }
            placeholder={field.placeholder || 'Select date range'}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={!!value}
              onCheckedChange={onChange}
            />
            <label
              htmlFor={field.name}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.label}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      {field.type !== 'boolean' && (
        <Label htmlFor={field.name}>{field.label}</Label>
      )}
      {renderField()}
    </div>
  );
}
