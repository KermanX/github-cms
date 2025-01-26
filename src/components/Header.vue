<template>
  <header
    class="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b dark:border-gray-700"
    v-bind="$attrs"
  >
    <div class="flex items-center space-x-2">
      <div class="i-carbon-logo-github text-xl dark:text-gray-200" />
      <span class="font-medium dark:text-gray-200">{{ githubStore.username }}</span>
      <span class="text-gray-500 dark:text-gray-400">/</span>
      <a 
        :href="repoUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1 text-gray-700 dark:text-gray-200 hover:text-blue-600 
               dark:hover:text-blue-400 transition-colors group"
      >
        <div class="i-carbon-repository text-xl transition-transform group-hover:-rotate-12" />
        <span class="font-medium">{{ githubStore.repository }}</span>
        <div class="i-carbon-arrow-up-right text-sm opacity-0 group-hover:opacity-100 
                    transition-opacity -ml-0.5 mt-0.5" />
      </a>
    </div>
    <div class="flex items-center space-x-4">
      <!-- 只读模式标识 -->
      <button
        v-if="githubStore.isReadonly"
        @click="handleReadonlyClick"
        class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-amber-600 bg-amber-50 
               hover:bg-amber-100 dark:bg-amber-400/10 dark:text-amber-300 
               dark:hover:bg-amber-400/20 transition-colors duration-200"
        title="点击进入设置页面添加 Token"
      >
        <div class="i-carbon-view" />
        <span class="text-sm">只读模式</span>
      </button>
      
      <!-- Preview Toggle Switch -->
      <div v-if="!githubStore.isReadonly && showPreviewToggle" 
           class="flex items-center gap-2">
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors duration-200"
          :class="[
            fileStore.isPreviewMode 
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          ]"
          @click="togglePreview"
        >
          <div :class="fileStore.isPreviewMode ? 'i-carbon-play' : 'i-carbon-code'" />
          <span class="text-sm">{{ fileStore.isPreviewMode ? '预览' : '编辑' }}</span>
        </button>
      </div>

      <button
        @click="toggleDark()"
        class="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <div v-if="isDark" class="i-carbon-sun text-xl text-gray-800 dark:text-gray-200" />
        <div v-else class="i-carbon-moon text-xl text-gray-800 dark:text-gray-200" />
      </button>
    </div>
  </header>

  <!-- Token Input Modal -->
  <Teleport to="body">
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 shadow-xl">
        <h3 class="text-lg font-medium mb-4 dark:text-gray-200">配置 GitHub Token</h3>
        <input 
          v-model="inputToken" 
          type="password"
          class="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 
                 dark:text-gray-200 mb-4"
          placeholder="ghp_xxxxxxxxxxxxxxxx"
          @keyup.enter="handleConfirm"
        />
        <div class="flex justify-end gap-2">
          <button 
            @click="showModal = false"
            class="px-4 py-2 rounded text-gray-600 hover:bg-gray-100 
                   dark:text-gray-400 dark:hover:bg-gray-700"
          >
            取消
          </button>
          <button 
            @click="handleConfirm"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useGithubStore } from '../stores/github'
import { useFileStore } from '../stores/files'
import { useDark, useToggle } from '@vueuse/core'
import { computed, ref } from 'vue'

const isDark = useDark()
const toggleDark = useToggle(isDark)
const githubStore = useGithubStore()
const fileStore = useFileStore()

const repoUrl = computed(() => 
  `https://github.com/${githubStore.username}/${githubStore.repository}`
)

const showModal = ref(false)
const inputToken = ref('')

const handleReadonlyClick = () => {
  showModal.value = true
}

const handleConfirm = () => {
  if (inputToken.value) {
    githubStore.setToken(inputToken.value)
    showModal.value = false
    inputToken.value = ''
  }
}

const showPreviewToggle = computed(() => {
  const path = fileStore.currentFile?.path || ''
  return path.endsWith('.md') || path.endsWith('.mdx')
})

const togglePreview = () => {
  fileStore.togglePreviewMode()
}
</script>
