import { useToast } from "../../hooks/use-toast"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map(function ({ id, title, description, variant, ...props }) {
        let bgColor = "bg-white border-slate-200"
        let icon = <Info size={20} className="text-slate-500" />

        if (variant === 'success') {
            bgColor = "bg-emerald-50 border-emerald-200 text-emerald-900"
            icon = <CheckCircle size={20} className="text-emerald-600" />
        } else if (variant === 'destructive') {
            bgColor = "bg-red-50 border-red-200 text-red-900"
            icon = <AlertCircle size={20} className="text-red-600" />
        }

        return (
          <ToastPrimitive.Root
            key={id}
            className={`group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full ${bgColor}`}
            {...props}
          >
            <div className="flex gap-3 items-start">
                <div className="mt-0.5">{icon}</div>
                <div className="grid gap-1">
                {title && <ToastPrimitive.Title className="text-sm font-bold">{title}</ToastPrimitive.Title>}
                {description && (
                    <ToastPrimitive.Description className="text-xs opacity-90">
                    {description}
                    </ToastPrimitive.Description>
                )}
                </div>
            </div>
            <ToastPrimitive.Close className="absolute right-2 top-2 rounded-md p-1 text-slate-500 opacity-0 transition-opacity hover:text-slate-900 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        )
      })}
      <ToastPrimitive.Viewport className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
    </ToastPrimitive.Provider>
  )
}