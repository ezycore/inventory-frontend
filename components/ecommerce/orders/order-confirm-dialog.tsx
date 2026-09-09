// coding-standard: maintained
import { cn } from "@/ui/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/components/alert-dialog";

/**
 * Confirmation prompt around a destructive/irreversible order action.
 *
 * Trigger-driven by default. Pass `open`/`onOpenChange` instead when the opener
 * is a dropdown menu item: the menu unmounts its item on select, which would take
 * a nested trigger's dialog down with it, so the row owns the state and renders
 * the dialog outside the menu.
 */
export function OrderConfirmDialog({
  trigger,
  title,
  description,
  actionLabel,
  onConfirm,
  destructive,
  open,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              destructive &&
                "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
            )}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
