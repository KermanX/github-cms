<template>
  <div class="h-full flex flex-col">
    <!-- 文件树部分 -->
    <div class="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Files</h3>
        <div class="flex gap-2">
          <button 
            class="p-1.5 rounded text-gray-600 dark:text-gray-400 transition-colors
                  hover:bg-gray-200/30 dark:hover:bg-gray-700/30"
            @click="startCreatingFile"
            title="新建文件"
          >
            <div class="i-carbon-document-add" />
          </button>
          <button 
            class="p-1.5 rounded text-gray-600 dark:text-gray-400 transition-colors
                  hover:bg-gray-200/30 dark:hover:bg-gray-700/30"
            @click="startCreatingFolder"
            title="新建文件夹"
          >
            <div class="i-carbon-folder-add" />
          </button>
        </div>
      </div>

      <!-- 新建文件输入框 -->
      <div v-if="isCreatingFile" class="mb-2">
        <input 
          ref="newFileInput"
          v-model="newFileName"
          type="text"
          class="w-full px-2 py-1 text-sm border rounded 
                dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          placeholder="输入文件名称"
          @keyup.enter="createFile"
          @keyup.esc="cancelCreatingFile"
          @blur="cancelCreatingFile"
        />
      </div>

      <!-- 新建文件夹输入框 -->
      <div v-if="isCreatingFolder" class="mb-2">
        <input 
          ref="newFolderInput"
          v-model="newFolderName"
          type="text"
          class="w-full px-2 py-1 text-sm border rounded 
                dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          placeholder="输入文件夹名称"
          @keyup.enter="createFolder"
          @keyup.esc="cancelCreatingFolder"
          @blur="cancelCreatingFolder"
        />
      </div>

      <!-- 文件树 -->
      <div v-if="!fileStore.files.length" class="text-gray-500 dark:text-gray-400 text-center mt-4">
        <div class="i-carbon-directory text-4xl mx-auto mb-2 dark:text-gray-300" />
        加载中...
      </div>
      <div v-else class="text-sm text-gray-800 dark:text-gray-200">
        <TreeItem
          v-for="file in rootFiles"
          :key="file.path"
          :item="file"
          @select="handleFileSelect"
        />
      </div>
    </div>
    
    <!-- 版本控制部分 -->
    <div class="h-64 border-t dark:border-gray-700">
      <VersionControl />
    </div>
  </div>
</template>

<script setup lang="ts">
import VersionControl from './VersionControl.vue'
import { computed, onMounted, ref, nextTick } from 'vue'
import { useFileStore } from '../stores/files'
import { useGithubStore } from '../stores/github'
import type { FileItem } from '../stores/files'
import TreeItem from './TreeItem.vue'

const fileStore = useFileStore()
const githubStore = useGithubStore()

const props = defineProps<{
  onSelect?: (content: string) => void
}>()

const isCreatingFolder = ref(false)
const newFolderName = ref('')
const newFolderInput = ref<HTMLInputElement | null>(null)

const startCreatingFolder = async () => {
  isCreatingFolder.value = true
  await nextTick()
  newFolderInput.value?.focus()
}

const createFolder = () => {
  if (!newFolderName.value) return
  
  let basePath = ''
  if (fileStore.focusedItem) {
    basePath = fileStore.focusedItem.type === 'tree' 
      ? fileStore.focusedItem.path + '/'
      : fileStore.focusedItem.path.split('/').slice(0, -1).join('/') + '/'
  }

  const fullPath = basePath + newFolderName.value
  const newFolder = fileStore.createFile(fullPath, '', 'tree')
  fileStore.setFocusedItem(newFolder)
  
  isCreatingFolder.value = false
  newFolderName.value = ''
}

const cancelCreatingFolder = () => {
  isCreatingFolder.value = false
  newFolderName.value = ''
}

const isCreatingFile = ref(false)
const newFileName = ref('')
const newFileInput = ref<HTMLInputElement | null>(null)

const startCreatingFile = async () => {
  isCreatingFile.value = true
  await nextTick()
  newFileInput.value?.focus()
}

const createFile = () => {
  if (!newFileName.value) return
  
  let basePath = ''
  if (fileStore.focusedItem) {
    basePath = fileStore.focusedItem.type === 'tree'
      ? fileStore.focusedItem.path + '/'
      : fileStore.focusedItem.path.split('/').slice(0, -1).join('/') + '/'
  }

  const fullPath = basePath + newFileName.value
  const newFile = fileStore.createFile(fullPath)
  fileStore.selectFile(newFile)
  
  if (props.onSelect) {
    props.onSelect('')
  }

  isCreatingFile.value = false
  newFileName.value = ''
}

const cancelCreatingFile = () => {
  isCreatingFile.value = false
  newFileName.value = ''
}

// 获取根级文件和文件夹
const rootFiles = computed(() => {
  return fileStore.files.filter(f => !f.path.includes('/'))
})

onMounted(async () => {
  try {
    // 先尝试加载持久化的数据
    const hasPersistedData = fileStore.loadPersistedFiles()
    
    if (!hasPersistedData) {
      // 如果没有持久化数据，则从GitHub获取
      await githubStore.fetchRepoTree()
    }
    
    // 如果有当前文件，自动加载其内容
    const currentFile = fileStore.currentFile
    if (currentFile && currentFile.type === 'blob') {
      handleFileSelect(currentFile)
    }
  } catch (error) {
    console.error('加载文件树失败:', error)
  }
})

const handleFileSelect = async (file: FileItem) => {
  if (file.type === 'blob') {
    // 先更新当前文件
    fileStore.selectFile(file)

    try {
      // 始终进行同步检查
      await fileStore.fetchFileContent(file, (content) => {
        if (fileStore.currentFile?.id === file.id && props.onSelect) {
          props.onSelect(content)
        }
      })
    } catch (error) {
      console.error('Error loading file:', error)
    }
  }
}
</script>

<style scoped>
li {
  cursor: pointer;
  padding: 4px 0;
}
li:hover {
  background-color: #f0f0f0;
}
</style>