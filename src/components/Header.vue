<template>
  <header class="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700">
    <div class="flex items-center space-x-2">
      <div class="i-carbon-logo-github text-xl dark:text-gray-200" />
      <span class="font-medium dark:text-gray-200">{{ githubStore.username }}</span>
      <span class="text-gray-500 dark:text-gray-400">/</span>
      <div class="i-carbon-repository text-xl dark:text-gray-200" />
      <span class="font-medium dark:text-gray-200">{{ githubStore.repository }}</span>
    </div>
    <div class="flex items-center space-x-4">
      <button
        @click="toggleDark()"
        class="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <div v-if="isDark" class="i-carbon-sun text-xl text-gray-800 dark:text-gray-200" />
        <div v-else class="i-carbon-moon text-xl text-gray-800 dark:text-gray-200" />
      </button>
      <button 
        @click="githubStore.clearGithubData()"
        class="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <div class="i-carbon-logout mr-1 text-gray-800 dark:text-gray-200" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useGithubStore } from '../stores/github'
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)
const githubStore = useGithubStore()
</script>
