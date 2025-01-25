<template>
  <div class="h-screen dark:bg-gray-900 overflow-hidden">
    <template v-if="githubStore.isConfigured">
      <div class="h-full flex flex-col">
        <Header class="border-b" />
        <div class="flex flex-1">
          <div class="relative" :style="{ width: `${sidebarWidth}px`, flexShrink: 0 }">
            <FileTree 
              class="h-full border-r dark:border-gray-700"
              :onSelect="handleSelect"
            />
            <ResizeHandle @resize="handleResize" />
          </div>
          <Editor class="flex-1 relative" :content="currentContent" />
        </div>
      </div>
    </template>
    <template v-else>
      <div class="h-full flex items-center justify-center">
        <div class="w-96">
          <div class="flex items-center justify-center mb-4">
            <div class="i-carbon-settings text-3xl mr-2 dark:text-gray-200" />
            <h2 class="text-xl font-bold text-center dark:text-gray-200">GitHub 配置</h2>
          </div>
          <Settings />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import FileTree from './components/FileTree.vue'
import Editor from './components/Editor.vue'
import Settings from './components/Settings.vue'
import Header from './components/Header.vue'
import { ref } from 'vue'
import { useGithubStore } from './stores/github'
import { useFileStore } from './stores/files'
import { useLocalStorage } from '@vueuse/core'
import ResizeHandle from './components/ResizeHandle.vue'

const githubStore = useGithubStore()
const fileStore = useFileStore()
const currentContent = ref('# 请选择一个文件进行编辑')

// 使用 localStorage 存储侧边栏宽度，默认 250px，最小 200px，最大 600px
const sidebarWidth = useLocalStorage('sidebar-width', 250)

const handleSelect = (content: string) => {
  // 设置编辑器内容，确保新文件时使用空字符串
  currentContent.value = content ?? ''
}

const handleResize = (width: number) => {
  const newWidth = Math.min(Math.max(width, 200), 600)
  sidebarWidth.value = newWidth
}
</script>

<style>
/* Reset default margins and ensure full viewport coverage */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}
</style>