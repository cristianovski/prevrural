import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, AlertTriangle } from "lucide-react"

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Confirmar Ação",
  description = "Tem certeza que deseja continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl">
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-slate-500 mt-2">
              {description}
            </DialogPrimitive.Description>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
            <button
              onClick={() => {
                onCancel();
                onOpenChange(false);
              }}
              className="mt-2 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100 hover:text-slate-900 sm:mt-0"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {confirmText}
            </button>
          </div>
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
