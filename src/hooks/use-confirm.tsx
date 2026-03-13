import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export function useConfirm() {
  const [promise, setPromise] = useState<{ resolve: (value: boolean) => void } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const confirm = useCallback((msg: string) => {
    setMessage(msg);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setPromise({ resolve });
    });
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open && promise) {
      promise.resolve(false);
      setPromise(null);
    }
  }, [promise]);

  const handleConfirm = useCallback(() => {
    if (promise) {
      promise.resolve(true);
      setPromise(null);
    }
    setIsOpen(false);
  }, [promise]);

  const handleClose = useCallback(() => {
    if (promise) {
      promise.resolve(false);
      setPromise(null);
    }
    setIsOpen(false);
  }, [promise]);

  // Return the JSX element directly to avoid unmount/remount issues
  const ConfirmDialog = () => (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-50">
          <Dialog.Title className="text-lg font-bold text-slate-800 mb-2">Confirmação</Dialog.Title>
          <Dialog.Description className="text-sm text-slate-600 mb-6">
            {message}
          </Dialog.Description>
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-md"
            >
              Confirmar
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );

  return { confirm, ConfirmDialog };
}
