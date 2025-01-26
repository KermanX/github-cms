<template>
  <div class="h-screen dark:bg-gray-900 overflow-hidden">
    <template v-if="githubStore.isConfigured">
      <div class="h-full flex flex-col">
        <Header class="border-b" />
        <div class="flex flex-1">
          <div class="relative border-r dark:border-gray-700" :style="{ width: `${sidebarWidth}px`, flexShrink: 0 }">
            <FileTree :onSelect="handleSelect" />
            <ResizeHandle @resize="handleResize" />
          </div>
          <div class="flex-1 relative">
            <template v-if="fileStore.showDiff">
              <DiffEditor
                :original-content="fileStore.currentFile?.originalContent || ''"
                :modified-content="fileStore.currentFile?.content || ''"
                :file-path="fileStore.currentFile?.path || ''"
                @change="handleEditorChange"
              />
            </template>
            <template v-else>
              <Editor 
                :content="fileStore.currentFile?.content || ''"
                @change="handleEditorChange"
              />
            </template>
          </div>
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
    <Toast />
    <Dialog />
  </div>
</template>

<script setup lang="ts">
import FileTree from './components/FileTree.vue'
import Editor from './components/Editor.vue'
import Settings from './components/Settings.vue'
import Header from './components/Header.vue'
import { onMounted } from 'vue'
import { useDark } from '@vueuse/core'
import { useGithubStore } from './stores/github'
import { useFileStore } from './stores/files'
import { useLocalStorage } from '@vueuse/core'
import ResizeHandle from './components/ResizeHandle.vue'
import Toast from './components/ui/Toast.vue'
import Dialog from './components/ui/Dialog.vue'
import DiffEditor from './components/DiffEditor.vue'

useDark()
const githubStore = useGithubStore()
const fileStore = useFileStore()

// 使用 localStorage 存储侧边栏宽度，默认 250px，最小 200px，最大 600px
const sidebarWidth = useLocalStorage('sidebar-width', 250)

const handleSelect = (content: string) => {
  if (fileStore.currentFile) {
    fileStore.setShowDiff(false)
  }
}

const handleResize = (width: number) => {
  const newWidth = Math.min(Math.max(width, 200), 600)
  sidebarWidth.value = newWidth
}

const handleEditorChange = (content: string) => {
  if (fileStore.currentFile) {
    fileStore.updateFileContent(fileStore.currentFile.id, content)
  }
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