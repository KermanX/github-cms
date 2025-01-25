<template>
  <div class="p-4 bg-gray-50 dark:bg-gray-800 h-full overflow-y-auto border-r dark:border-gray-700">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">文件浏览器</h3>
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
        :file="file"
        @select="handleFileSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
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
  
  // 类似文件创建的逻辑
  let basePath = ''
  if (fileStore.currentFolder) {
    basePath = fileStore.currentFolder.path + '/'
  } else if (fileStore.currentFile) {
    basePath = fileStore.currentFile.path.split('/').slice(0, -1).join('/') + '/'
  }

  const fullPath = basePath + newFolderName.value
  const newFolder = fileStore.createFile(fullPath, '', 'tree')
  fileStore.selectFolder(newFolder)
  
  // 重置状态
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
  if (fileStore.currentFolder) {
    basePath = fileStore.currentFolder.path + '/'
  } else if (fileStore.currentFile) {
    basePath = fileStore.currentFile.path.split('/').slice(0, -1).join('/') + '/'
  }

  const fullPath = basePath + newFileName.value
  const newFile = fileStore.createFile(fullPath)
  fileStore.selectFile(newFile)
  
  // 直接触发文件选择事件，传递空内容
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
    await githubStore.fetchRepoTree()
    
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

    // 如果文件已经加载过内容，直接使用
    if (file.content && !file.isLoading) {
      if (props.onSelect) {
        props.onSelect(file.content)
      }
      return
    }

    try {
      // 使用回调确保内容更新时检查当前文件
      await fileStore.fetchFileContent(file, (content) => {
        // 检查选中的文件是否还是当前正在加载的文件
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