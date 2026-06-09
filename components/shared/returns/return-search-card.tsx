import type { UseFormRegisterReturn } from 'react-hook-form';
import { Search } from 'lucide-react';
import { Button } from '@/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import { Input } from '@/ui/components/input';

export interface ReturnSearchCardProps {
  /** Card title, e.g. "Find Sale" or "Find Purchase Order" */
  title: string;
  /** Card description text */
  description: string;
  /** Input placeholder text */
  placeholder: string;
  /** Spread onto the <Input> — result of `searchForm.register(fieldName)` */
  inputProps: UseFormRegisterReturn;
  /** Whether a search request is in flight */
  isLoading: boolean;
  /** Whether the input currently has a value (controls Search button disabled state) */
  hasValue: boolean;
  /** When truthy, shows the Clear button */
  selectedId: string | null | undefined;
  /** Called when the form is submitted — wrap with `searchForm.handleSubmit(handler)` */
  onFormSubmit: React.FormEventHandler<HTMLFormElement>;
  onClear: () => void;
}

export function ReturnSearchCard({
  title,
  description,
  placeholder,
  inputProps,
  isLoading,
  hasValue,
  selectedId,
  onFormSubmit,
  onClear,
}: ReturnSearchCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onFormSubmit} className="flex gap-4">
          <div className="flex-1">
            <Input placeholder={placeholder} {...inputProps} />
          </div>
          <Button type="submit" disabled={isLoading || !hasValue}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          {selectedId && (
            <Button type="button" variant="outline" onClick={onClear}>
              Clear
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
