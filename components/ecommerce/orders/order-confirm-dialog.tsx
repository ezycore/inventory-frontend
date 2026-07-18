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

/** Confirmation prompt around a destructive/irreversible order action. */
export function OrderConfirmDialog({
  trigger,
  title,
  description,
  actionLabel,
  onConfirm,
  destructive,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
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
