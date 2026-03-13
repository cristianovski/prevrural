import * as React from "react"

export const Dialog = ({ children, open, onOpenChange }: any) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="z-50 bg-white p-6 rounded-lg shadow-lg">
        {children}
      </div>
    </div>
  );
}

export const DialogContent = ({ children }: any) => <div>{children}</div>;
export const DialogHeader = ({ children }: any) => <div className="mb-4">{children}</div>;
export const DialogTitle = ({ children }: any) => <h2 className="text-lg font-semibold">{children}</h2>;
export const DialogDescription = ({ children }: any) => <p className="text-sm text-gray-500">{children}</p>;
export const DialogFooter = ({ children }: any) => <div className="mt-6 flex justify-end space-x-2">{children}</div>;
