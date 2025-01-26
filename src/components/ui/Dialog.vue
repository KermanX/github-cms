<template>
  <TransitionRoot appear :show="!!notificationStore.dialog" as="div">
    <Dialog as="div" @close="handleClose" class="relative z-50">
      <TransitionChild
        as="div"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/25 dark:bg-black/50" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            as="div"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel 
              class="w-full max-w-md transform overflow-hidden rounded-lg 
                     bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
            >
              <DialogTitle 
                class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100 flex items-center gap-2"
              >
                <div :class="{
                  'i-carbon-information text-blue-500': dialog?.type === 'info',
                  'i-carbon-warning text-yellow-500': dialog?.type === 'warning',
                  'i-carbon-error text-red-500': dialog?.type === 'error',
                  'i-carbon-checkmark text-green-500': dialog?.type === 'success'
                }" />
                {{ dialog?.title }}
              </DialogTitle>
              <div class="mt-2">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ dialog?.message }}
                </p>
              </div>

              <div class="mt-4 flex justify-end gap-2">
                <button
                  v-if="dialog?.onCancel"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                         hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  @click="handleCancel"
                >
                  {{ dialog.cancelText || 'Cancel' }}
                </button>
                <button
                  class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                  :class="{
                    'bg-blue-500 hover:bg-blue-600': dialog?.type === 'info',
                    'bg-yellow-500 hover:bg-yellow-600': dialog?.type === 'warning',
                    'bg-red-500 hover:bg-red-600': dialog?.type === 'error',
                    'bg-green-500 hover:bg-green-600': dialog?.type === 'success'
                  }"
                  @click="handleConfirm"
                >
                  {{ dialog?.confirmText || 'Confirm' }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { useNotificationStore } from '../../stores/notification'
import { computed } from 'vue'

const notificationStore = useNotificationStore()
const dialog = computed(() => notificationStore.dialog)

const handleClose = () => {
  dialog.value?.onCancel?.()
  notificationStore.hideDialog()
}

const handleConfirm = () => {
  dialog.value?.onConfirm?.()
  notificationStore.hideDialog()
}

const handleCancel = () => {
  dialog.value?.onCancel?.()
  notificationStore.hideDialog()
}
</script>
