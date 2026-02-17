import * as React from "react"

// Tipos simplificados para o Toast
type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive" | "success"
}

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 1000000

type State = {
  toasts: ToastProps[]
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: any) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryState = {
        ...memoryState,
        toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
      }
      break
    case "DISMISS_TOAST":
      const { toastId } = action
      if (toastId) {
        // Adiciona ao stack de remoção
        // Simplificação para este projeto: remove direto da lista
        memoryState = {
          ...memoryState,
          toasts: memoryState.toasts.filter((t) => t.id !== toastId),
        }
      } else {
        memoryState = { ...memoryState, toasts: [] }
      }
      break
  }
  listeners.forEach((listener) => listener(memoryState))
}

function toast({ ...props }: Omit<ToastProps, "id">) {
  const id = genId()
  const update = (props: ToastProps) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss()
      },
    },
  })

  return { id, dismiss, update }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }