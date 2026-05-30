// hooks/use-confirm.tsx
import { EasyAlertDialog } from "@/ui/components/custom/easy-alert-dialog";
import { useState } from "react";

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
}

export const useConfirm = (defaultOptions?: ConfirmOptions) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>(defaultOptions ?? {});
  const [resolveRef, setResolveRef] = useState<((val: boolean) => void) | null>(null);

  const confirm = (runtimeOptions?: ConfirmOptions): Promise<boolean> => {
    setOptions({ ...defaultOptions, ...runtimeOptions });
    setOpen(true);
    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  };

  const handleConfirm = () => {
    resolveRef?.(true);
    setResolveRef(null);
    setOpen(false);
  };

  const handleCancel = () => {
    resolveRef?.(false);
    setResolveRef(null);
    setOpen(false);
  };

  const ConfirmDialog = () => (
    <EasyAlertDialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleCancel();
      }}
      title={options.title ?? "Are you sure?"}
      description={options.description ?? "This action cannot be undone."}
      confirmLabel={options.confirmLabel ?? "Confirm"}
      cancelLabel={options.cancelLabel ?? "Cancel"}
      confirmClassName={options.confirmClassName}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialog };
};