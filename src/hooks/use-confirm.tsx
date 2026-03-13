import { useState, useCallback } from "react";

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [resolver, setResolver] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirm = useCallback((msg: string) => {
    setMessage(msg);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      setResolver({ resolve });
    });
  }, []);

  const handleConfirm = () => {
    if (resolver) resolver.resolve(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolver) resolver.resolve(false);
    setIsOpen(false);
  };

  const ConfirmDialog = () => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative flex flex-col gap-4">
          <h3 className="text-lg font-bold text-slate-800">Confirmação</h3>
          <p className="text-sm text-slate-600">{message}</p>
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow transition"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return { confirm, ConfirmDialog };
}
