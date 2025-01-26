import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Dialog {
  hidden?: boolean
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export interface Toast {
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  duration?: number
}

export const useNotificationStore = defineStore('notification', () => {
  const dialog = ref<Dialog | null>(null)
  const toast = ref<Toast | null>(null)

  const showDialog = (dialogConfig: Dialog) => {
    dialog.value = dialogConfig
  }

  const hideDialog = () => {
    dialog.value && (dialog.value.hidden = true)
  }

  const showToast = (toastConfig: Toast) => {
    toast.value = toastConfig
    if (toastConfig.duration !== 0) {
      setTimeout(() => {
        hideToast()
      }, toastConfig.duration || 3000)
    }
  }

  const hideToast = () => {
    toast.value = null
  }

  return {
    dialog,
    toast,
    showDialog,
    hideDialog,
    showToast,
    hideToast
  }
})
