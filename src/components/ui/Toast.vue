<template>
  <TransitionRoot
    appear
    :show="!!notificationStore.toast"
    as="template"
    enter="transform duration-300"
    enter-from="translate-y-2 opacity-0"
    enter-to="translate-y-0 opacity-100"
    leave="transform duration-300"
    leave-from="translate-y-0 opacity-100"
    leave-to="translate-y-2 opacity-0"
  >
    <div 
      v-if="notificationStore.toast"
      class="fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white flex items-center gap-2"
      :class="{
        'bg-blue-500': notificationStore.toast.type === 'info',
        'bg-yellow-500': notificationStore.toast.type === 'warning',
        'bg-red-500': notificationStore.toast.type === 'error',
        'bg-green-500': notificationStore.toast.type === 'success'
      }"
    >
      <div :class="{
        'i-carbon-information': notificationStore.toast.type === 'info',
        'i-carbon-warning': notificationStore.toast.type === 'warning',
        'i-carbon-error': notificationStore.toast.type === 'error',
        'i-carbon-checkmark': notificationStore.toast.type === 'success'
      }" />
      <span>{{ notificationStore.toast.message }}</span>
    </div>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { useNotificationStore } from '../../stores/notification'
import { TransitionRoot } from '@headlessui/vue'

const notificationStore = useNotificationStore()
</script>
