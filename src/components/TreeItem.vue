<template>
  <div class="select-none" v-if="!item.isDeleted">
    <div 
      class="flex items-center rounded px-2 py-1.5 cursor-pointer relative group transition-colors"
      @click="handleClick"
      :class="{
        'hover:bg-gray-100/70 dark:hover:bg-gray-700/30': !isFocused && !item.status,
        'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100/80 dark:hover:bg-blue-800/40': isFocused,
      }"
    >
      <!-- Left part: icons and name -->
      <div class="flex items-center flex-grow min-w-0">
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
        
        <!-- 文件名和状态标记 -->
        <div class="flex items-center gap-1">
          <span :class="{ 'opacity-50': item.isLoading }">
            {{ item.name }}
            <span v-if="item.isLoading" class="ml-1 text-gray-400">(加载中...)</span>
          </span>
          
          <!-- 状态标记 移到这里 -->
          <span v-if="item.status" 
                class="text-xs font-medium px-1 rounded"
                :class="{
                  'text-yellow-500': item.status === 'modified',
                  'text-green-500': item.status === 'new',
                  'text-red-500': item.status === 'deleted'
                }">
            {{ statusText }}
          </span>
        </div>
      </div>

      <!-- Right part: actions -->
      <div class="flex items-center gap-1">
        <!-- Delete button -->
        <button 
          class="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400
                 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10
                 transition-all duration-200"
          @click.stop="handleDelete"
          title="Delete"
        >
          <div class="i-carbon-trash-can text-sm" />
        </button>
      </div>
    </div>

    <!-- 子文件列表 -->
    <div v-if="isFolder && isExpanded" class="ml-4">
      <TreeItem
        v-for="child in children"
        :key="child.path"
        :item="child"
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
  item: FileItem
  level?: number
}>()

const emit = defineEmits<{
  (e: 'select', file: FileItem): void
}>()

const isExpanded = ref(true) // 默认展开
const fileStore = useFileStore()

const isFolder = computed(() => props.item.type === 'tree')
const isCurrentFile = computed(() => fileStore.currentFile?.id === props.item.id)
const isFocused = computed(() => fileStore.focusedItem?.id === props.item.id)

const children = computed(() => {
  return fileStore.files.filter(f => {
    const parentPath = props.item.path + '/'
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
  fileStore.setFocusedItem(props.item) // 任何项目点击时都设置为focusedItem
  if (isFolder.value) {
    toggleFolder()
  } else {
    emit('select', props.item)
  }
}

const statusText = computed(() => {
  switch (props.item.status) {
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

const handleDelete = () => {
  if (confirm(`确定要删除 ${props.item.path} 吗？${props.item.type === 'tree' ? '\n注意：这将删除文件夹下的所有文件！' : ''}`)) {
    fileStore.deleteFile(props.item.id)
  }
}
</script>
