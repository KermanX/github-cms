<template>
  <div class="h-screen dark:bg-gray-900 overflow-hidden">
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
            <MarkdownPreview 
              v-show="fileStore.isPreviewMode && canPreview"
              :content="fileStore.currentFile?.content || ''" 
            />
            <Editor 
              v-show="!(fileStore.isPreviewMode && canPreview)"
              :content="fileStore.currentFile?.content || ''"
              @change="handleEditorChange"
            />
          </template>
        </div>
      </div>
    </div>
    <Toast />
    <Dialog />
  </div>
</template>

<script setup lang="ts">
import FileTree from './components/FileTree.vue'
import Editor from './components/Editor.vue'
import Header from './components/Header.vue'
import { ref, computed } from 'vue'
import { onMounted } from 'vue'
import { useDark } from '@vueuse/core'
import { useGithubStore } from './stores/github'
import { useFileStore } from './stores/files'
import { useLocalStorage } from '@vueuse/core'
import ResizeHandle from './components/ResizeHandle.vue'
import Toast from './components/ui/Toast.vue'
import Dialog from './components/ui/Dialog.vue'
import DiffEditor from './components/DiffEditor.vue'
import MarkdownPreview from './components/MarkdownPreview.vue'

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

const canPreview = computed(() => {
  const path = fileStore.currentFile?.path || ''
  return path.endsWith('.md') || path.endsWith('.mdx')
})
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