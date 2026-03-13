import * as React from "react"
import { ConfirmDialog } from "../components/ui/confirm-dialog"

interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

export function useConfirm() {
  const [promise, setPromise] = React.useState<{ resolve: (value: boolean) => void } | null>(null);
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ConfirmOptions>({});

  const confirm = React.useCallback((opts?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts || {});
      setPromise({ resolve });
      setOpen(true);
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    promise?.resolve(true);
    setPromise(null);
  }, [promise]);

  const handleCancel = React.useCallback(() => {
    promise?.resolve(false);
    setPromise(null);
  }, [promise]);

  const onOpenChange = React.useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && promise) {
      promise.resolve(false);
      setPromise(null);
    }
  }, [promise]);

  const ConfirmDialogComponent = React.useCallback(() => {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title={options.title}
        description={options.description}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }, [open, options, handleConfirm, handleCancel, onOpenChange]);

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}
