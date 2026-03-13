import { useState, useCallback } from "react";

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const confirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setConfig({ title, message, onConfirm });
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(() => {
    if (config?.onConfirm) {
      config.onConfirm();
    }
    setIsOpen(false);
  }, [config]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    config,
    confirm,
    handleConfirm,
    handleCancel
  };
}
