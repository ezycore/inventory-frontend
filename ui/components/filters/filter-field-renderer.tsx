"use client";

import { FilterField } from '@/types/filter';
import { Input } from '@ui/components/input';
import { Label } from '@ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select';
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
          <Input
            type="number"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
            min={field.min}
            max={field.max}
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            <Input
              type="number"
              placeholder="Min"
              value={value?.min || ''}
              onChange={(e) =>
                onChange({ ...value, min: e.target.value ? Number(e.target.value) : undefined })
              }
              min={field.min}
            />
            <Input
              type="number"
              placeholder="Max"
              value={value?.max || ''}
              onChange={(e) =>
                onChange({ ...value, max: e.target.value ? Number(e.target.value) : undefined })
              }
              max={field.max}
            />
          </div>
        );

      case 'date':
        return (
          <DatePicker
            date={value ? new Date(value) : null}
            onSelect={(date) => onChange(date ? date.toISOString() : undefined)}
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
                      from: range.from?.toISOString(),
                      to: range.to?.toISOString(),
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
