import { CornerUpLeft } from 'lucide-react';
import { Button } from '@/ui/components/button';

export interface ReturnSubmitActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled: boolean;
  /** Override the submit button label. Defaults to "Process Return". */
  submitLabel?: string;
}

export function ReturnSubmitActions({
  onCancel,
  onSubmit,
  isSubmitting,
  disabled,
  submitLabel = 'Process Return',
}: ReturnSubmitActionsProps) {
  return (
    <div className="flex justify-end gap-4">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSubmit} disabled={disabled || isSubmitting}>
        <CornerUpLeft className="h-4 w-4 mr-2" />
        {isSubmitting ? 'Processing...' : submitLabel}
      </Button>
    </div>
  );
}
