import { readonly, ref } from 'vue'

export type ToastVariant = 'success' | 'info'

export type ToastItem = {
  id: number
  message: string
  variant: ToastVariant
}

type ShowToastOptions = {
  durationMs?: number
  variant?: ToastVariant
}

const toasts = ref<ToastItem[]>([])
let toastSeq = 0

const removeToast = (id: number) => {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

const clearToasts = () => {
  toasts.value = []
}

const showToast = (message: string, options: ShowToastOptions = {}) => {
  toastSeq += 1
  const id = toastSeq
  const item: ToastItem = {
    id,
    message,
    variant: options.variant ?? 'success',
  }
  toasts.value = [...toasts.value, item]

  const durationMs = options.durationMs ?? 2200
  window.setTimeout(() => {
    removeToast(id)
  }, durationMs)

  return id
}

export const useToast = () => ({
  toasts: readonly(toasts),
  showToast,
  removeToast,
  clearToasts,
})
