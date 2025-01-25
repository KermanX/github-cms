<template>
  <div class="select-none" v-if="!file.isDeleted">
    <div 
      class="flex items-center rounded px-2 py-1.5 cursor-pointer relative group"
      @click="handleClick"
      :class="{
        'hover:bg-gray-200 dark:hover:bg-gray-700': !file.isDeleted,
        'text-gray-400 dark:text-gray-500': file.isDeleted,
        'bg-blue-100/50 dark:bg-blue-900/20': isCurrentFile,
        'bg-gray-100/70 dark:bg-gray-800/50': isCurrentFolder && !isCurrentFile
      }"
    >
      <div class="flex items-center flex-grow">
        <!-- 文件夹展开/折叠图标 -->
        <div v-if="isFolder" 
             class="mr-1 text-base cursor-pointer text-gray-600 dark:text-gray-300"
             @click.stop="toggleFolder">
          <div v-if="isExpanded" class="i-carbon-caret-down" />
          <div v-else class="i-carbon-caret-right" />
        </div>
        <!-- 文件夹/文件图标 -->
        <div v-if="isFolder" class="i-carbon-folder text-gray-500 dark:text-gray-400 mr-1 text-base"></div>
        <div v-else class="i-carbon-document text-gray-500 dark:text-gray-400 mr-1 text-base"></div>
        <span :class="{ 
          'text-blue-600 dark:text-blue-400': isCurrentFile,
          'text-gray-700 dark:text-gray-200': !isCurrentFile,
          'opacity-50': file.isLoading
        }">
          {{ file.name }}
          <span v-if="file.isLoading" class="ml-1 text-gray-400">(加载中...)</span>
        </span>
      </div>
      
      <!-- 状态标记 -->
      <div v-if="file.status" 
           class="absolute bottom-0 right-1 text-xs font-medium px-1 rounded"
           :class="{
             'text-yellow-500': file.status === 'modified',
             'text-green-500': file.status === 'new',
             'text-red-500': file.status === 'deleted'
           }">
        {{ statusText }}
      </div>
    </div>

    <!-- 子文件列表 -->
    <div v-if="isFolder && isExpanded" class="ml-4">
      <TreeItem
        v-for="child in children"
        :key="child.path"
        :file="child"
        :level="(level ?? 0) + 1"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import type { FileItem } from '../stores/files'
import { useFileStore, FileStatus } from '../stores/files'

const props = defineProps<{
  file: FileItem
  level?: number
}>()

const emit = defineEmits<{
  (e: 'select', file: FileItem): void
}>()

const isExpanded = ref(true) // 默认展开
const fileStore = useFileStore()

const isFolder = computed(() => props.file.type === 'tree')
const isCurrentFile = computed(() => fileStore.currentFile?.id === props.file.id)
const isCurrentFolder = computed(() => fileStore.currentFolder?.id === props.file.id)

const children = computed(() => {
  return fileStore.files.filter(f => {
    const parentPath = props.file.path + '/'
    return f.path.startsWith(parentPath) && 
           f.path.slice(parentPath.length).indexOf('/') === -1
  })
})

const toggleFolder = () => {
  if (isFolder.value) {
    isExpanded.value = !isExpanded.value
  }
}

const handleClick = () => {
  if (isFolder.value) {
    toggleFolder()
    fileStore.selectFolder(props.file)
  } else {
    emit('select', props.file)
  }
}

const statusText = computed(() => {
  switch (props.file.status) {
    case FileStatus.MODIFIED:
      return 'M'
    case FileStatus.NEW:
      return 'U'
    case FileStatus.DELETED:
      return 'D'
    default:
      return ''
  }
})
</script>
