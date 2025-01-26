<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
    <div class="p-4 border-b dark:border-gray-700 flex-shrink-0">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Changes</h3>
        <div class="flex gap-2">
          <button 
            class="p-1.5 rounded text-gray-600 dark:text-gray-400 transition-colors
                   hover:bg-gray-200/30 dark:hover:bg-gray-700/30 disabled:opacity-50"
            title="Commit Changes"
            :disabled="!hasModifiedFiles || !commitMessage.trim()"
            @click="handleCommit"
          >
            <div class="i-carbon-cloud-upload" />
          </button>
        </div>
      </div>

      <!-- 提交信息输入框 - 移除 v-if -->
      <input 
        v-model="commitMessage"
        type="text"
        class="w-full px-2 py-1 text-sm border rounded 
               dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200
               disabled:opacity-50 disabled:cursor-not-allowed"
        placeholder="Enter commit message"
      />
    </div>

    <!-- 修改文件列表 -->
    <div class="flex-1 overflow-y-auto px-2">
      <template v-if="hasModifiedFiles">
        <div 
          v-for="file in modifiedFiles" 
          :key="file.id"
          class="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700/30 rounded group"
        >
          <div class="flex items-center gap-2 min-w-0">
            <!-- 文件状态标记 -->
            <span class="text-xs font-medium px-1 rounded"
                  :class="{
                    'text-yellow-500': file.status === 'modified',
                    'text-green-500': file.status === 'new',
                    'text-red-500': file.status === 'deleted'
                  }">
              {{ getStatusText(file.status) }}
            </span>
            
            <!-- 文件名 -->
            <span class="truncate text-sm text-gray-600 dark:text-gray-300">
              {{ file.path }}
            </span>
          </div>

          <!-- 操作按钮 -->
          <button 
            class="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-500 
                   hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            @click="handleRevert(file)"
            title="Revert changes"
          >
            <div class="i-carbon-undo text-sm" />
          </button>
        </div>
      </template>
      
      <!-- 空状态 -->
      <div v-else class="text-center p-4 text-gray-500 dark:text-gray-400">
        <div class="i-carbon-checkmark-outline text-2xl mx-auto mb-2" />
        <p class="text-sm">No changes</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFileStore, FileStatus, FileItem } from '../stores/files'
import { useGithubStore } from '../stores/github'

const fileStore = useFileStore()
const githubStore = useGithubStore()
const commitMessage = ref('')

const modifiedFiles = computed(() => fileStore.getModifiedFiles())
const hasModifiedFiles = computed(() => modifiedFiles.value.length > 0)

const getStatusText = (status?: FileStatus) => {
  switch (status) {
    case FileStatus.MODIFIED:
      return 'M'
    case FileStatus.NEW:
      return 'U'
    case FileStatus.DELETED:
      return 'D'
    default:
      return ''
  }
}

const handleRevert = (file: FileItem) => {
  if (confirm(`确定要撤销对 ${file.path} 的修改吗？`)) {
    fileStore.revertFile(file.id)
  }
}

const handleCommit = async () => {
  if (!commitMessage.value.trim()) {
    alert('Please enter a commit message')
    return
  }

  try {
    const changes = modifiedFiles.value.map(file => ({
      path: file.path,
      content: file.content,
      isDeleted: file.isDeleted
    }))

    // 格式化提交信息，添加作者信息
    const fullMessage = `${commitMessage.value}\n\nBy: ${githubStore.username}`

    await githubStore.commitAndPush(fullMessage, changes)

    // 重新加载文件树
    await githubStore.fetchRepoTree()
    
    // 清空提交信息
    commitMessage.value = ''
    
    alert('Changes committed successfully!')
  } catch (error) {
    console.error('Commit failed:', error)
    alert('Failed to commit changes. Please try again.')
  }
}
</script>
