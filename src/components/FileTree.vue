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
import { useNotificationStore } from '../stores/notification'

const fileStore = useFileStore()
const githubStore = useGithubStore()
const notificationStore = useNotificationStore()

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

const isPathConflict = (path: string) => {
  return fileStore.files.some(file => 
    file.path.toLowerCase() === path.toLowerCase() && 
    !file.isDeleted
  )
}

const getConflictMessage = (path: string, type: 'file' | 'folder') => {
  const name = path.split('/').pop()
  return `已存在同名${type === 'file' ? '文件' : '文件夹'} "${name}"`
}

const getTargetPath = (fileName: string) => {
  if (!fileStore.focusedItem) {
    return fileName
  }

  if (fileStore.focusedItem.type === 'tree') {
    // If focused on a folder, create inside it
    return `${fileStore.focusedItem.path}/${fileName}`
  } else {
    // If focused on a file, create next to it
    const parentPath = fileStore.focusedItem.path.split('/').slice(0, -1).join('/')
    return parentPath ? `${parentPath}/${fileName}` : fileName
  }
}

const createFolder = () => {
  if (!newFolderName.value) return
  
  const fullPath = getTargetPath(newFolderName.value)
  
  if (isPathConflict(fullPath)) {
    notificationStore.showToast({
      message: getConflictMessage(fullPath, 'folder'),
      type: 'error'
    })
    return
  }

  // 确保创建所有必要的父文件夹
  const pathParts = fullPath.split('/')
  let currentPath = ''
  
  for (let i = 0; i < pathParts.length - 1; i++) {
    currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i]
    if (!fileStore.files.some(f => f.path === currentPath && f.type === 'tree')) {
      fileStore.createFile(currentPath, '', 'tree')
    }
  }

  const newFolder = fileStore.createFile(fullPath, '', 'tree')
  fileStore.setFocusedItem(newFolder)
  fileStore.persistFiles() // 确保保存更改
  
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
  
  const fullPath = getTargetPath(newFileName.value)

  if (isPathConflict(fullPath)) {
    notificationStore.showToast({
      message: getConflictMessage(fullPath, 'file'),
      type: 'error'
    })
    return
  }

  // 确保创建所有必要的父文件夹
  const pathParts = fullPath.split('/')
  let currentPath = ''
  
  for (let i = 0; i < pathParts.length - 1; i++) {
    currentPath = currentPath ? `${currentPath}/${pathParts[i]}` : pathParts[i]
    if (!fileStore.files.some(f => f.path === currentPath && f.type === 'tree')) {
      fileStore.createFile(currentPath, '', 'tree')
    }
  }

  const newFile = fileStore.createFile(fullPath)
  fileStore.selectFile(newFile)
  fileStore.persistFiles() // 确保保存更改
  
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

// 修改获取根级文件和文件夹的方法
const buildFileTree = (files: FileItem[]) => {
  const allFiles = [...files].filter(f => !f.isDeleted) // 过滤掉已删除的文件
  
  // 首先按路径长度排序，确保父文件夹在子文件之前处理
  allFiles.sort((a, b) => {
    const aDepth = a.path.split('/').length
    const bDepth = b.path.split('/').length
    return aDepth - bDepth
  })

  // 清除所有现有的子节点关系
  allFiles.forEach(file => {
    file.children = undefined
  })

  // 重新建立父子关系
  allFiles.forEach(file => {
    const parentPath = file.path.split('/').slice(0, -1).join('/')
    if (parentPath) {
      const parent = allFiles.find(f => f.path === parentPath && f.type === 'tree')
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(file)
      }
    }
  })

  // 对每个层级的文件进行排序
  const sortFiles = (items: FileItem[]) => {
    items.sort((a, b) => {
      // 文件夹优先
      if (a.type !== b.type) {
        return a.type === 'tree' ? -1 : 1
      }
      // 按名称排序
      return a.name.localeCompare(b.name)
    })
    
    // 递归排序子文件夹
    items.forEach(item => {
      if (item.children) {
        sortFiles(item.children)
      }
    })
  }

  // 只返回根级文件和文件夹
  const rootFiles = allFiles.filter(file => !file.path.includes('/'))
  sortFiles(rootFiles)
  return rootFiles
}

// 修改 rootFiles 计算属性
const rootFiles = computed(() => {
  return buildFileTree(fileStore.files)
})

onMounted(async () => {
  try {
    // 先尝试加载持久化的数据
    const hasPersistedData = fileStore.loadPersistedFiles()
    
    if (!hasPersistedData) {
      // 如果没有持久化数据，则从GitHub获取
      await githubStore.fetchRepoTree()
    }
    
    // 恢复焦点项
    const focusedItem = fileStore.restoreFocusedItem()
    
    // 按优先级选择要加载的文件：
    // 1. 上次打开的文件
    // 2. README.md
    const currentFile = fileStore.currentFile
    if (currentFile?.type === 'blob') {
      handleFileSelect(currentFile)
    } else if (focusedItem?.type === 'blob') {
      handleFileSelect(focusedItem)
    } else {
      // 查找 README.md
      const readmeFile = fileStore.files.find(f => 
        f.name.toLowerCase() === 'readme.md' && f.type === 'blob'
      )
      if (readmeFile) {
        handleFileSelect(readmeFile)
      }
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