<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
    <div class="p-4 border-b dark:border-gray-700 flex-shrink-0">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Changes</h3>
        <div class="flex gap-2">
          <!-- 添加撤回所有按钮 -->
          <button 
            v-if="hasModifiedFiles"
            class="p-1.5 rounded text-gray-600 dark:text-gray-400 transition-colors
                   hover:bg-gray-200/30 dark:hover:bg-gray-700/30"
            title="Revert all changes"
            @click="handleRevertAll"
          >
            <div class="i-carbon-reset" />
          </button>
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
        @keydown.ctrl.enter="handleCommit"
      />
    </div>

    <!-- 修改文件列表 -->
    <div class="flex-1 overflow-y-auto px-2">
      <template v-if="hasModifiedFiles">
        <div 
          v-for="file in modifiedFiles" 
          :key="file.id"
          class="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700/30 rounded group cursor-pointer"
          @click="handleEditDiff(file)"
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

          <!-- 操作按钮组 -->
          <div class="opacity-0 group-hover:opacity-100 flex gap-1">
            <!-- 普通编辑按钮 -->
            <button 
              class="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              @click.stop="handleEditNormal(file)"
              title="Edit in normal mode"
            >
              <div class="i-carbon-edit text-sm" />
            </button>
            <!-- 撤销按钮 -->
            <button 
              class="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              @click.stop="handleRevert(file)"
              title="Revert changes"
            >
              <div class="i-carbon-undo text-sm" />
            </button>
          </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useFileStore, FileStatus, FileItem } from '../stores/files'
import { useGithubStore } from '../stores/github'
import { useNotificationStore } from '../stores/notification'

const fileStore = useFileStore()
const githubStore = useGithubStore()
const notificationStore = useNotificationStore()

const COMMIT_MESSAGE_KEY = 'draft_commit_message'
const commitMessage = ref(localStorage.getItem(COMMIT_MESSAGE_KEY) || '')

// 监听提交信息变化，保存到localStorage
watch(commitMessage, (newValue) => {
  localStorage.setItem(COMMIT_MESSAGE_KEY, newValue)
})

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
  notificationStore.showDialog({
    title: '确认撤销',
    message: `确定要撤销对 ${file.path} 的修改吗？`,
    type: 'warning',
    onConfirm: () => fileStore.revertFile(file.id)
  })
}

const handleCommit = async () => {
  if (!commitMessage.value.trim()) {
    notificationStore.showToast({
      message: 'Please enter a commit message',
      type: 'warning'
    })
    return
  }

  try {
    const changes = modifiedFiles.value.map(file => ({
      path: file.path,
      content: file.content,
      isDeleted: file.isDeleted
    }))

    const fullMessage = `${commitMessage.value}\n\nBy: ${githubStore.username}`

    // 显示提交中的状态
    notificationStore.showToast({
      message: 'Committing changes...',
      type: 'info',
      duration: 0
    })

    await githubStore.commitAndPush(fullMessage, changes)
    await githubStore.updateLastCommitSha() // 更新最新的SHA

    // 提交成功后，更新所有文件的原始内容
    fileStore.updateFileOriginalContent()
    
    // 提交成功后清除保存的草稿
    localStorage.removeItem(COMMIT_MESSAGE_KEY)
    commitMessage.value = ''
    
    notificationStore.showToast({
      message: 'Changes committed successfully!',
      type: 'success'
    })
  } catch (error: any) {
    console.error('Commit failed:', error)
    
    let errorMessage = 'Failed to commit changes. Please try again.'
    
    if (error.message === 'Remote repository has been updated. Please sync first.') {
      errorMessage = 'Remote changes detected. Please sync your workspace first.'
    } else if (error?.response?.data?.message?.includes('Update is not a fast-forward')) {
      errorMessage = 'Merge conflict detected. Please sync your workspace first.'
    }

    notificationStore.showToast({
      message: errorMessage,
      type: 'error',
      duration: 5000
    })

    // 如果检测到远程更改，尝试同步
    if (error.message.includes('sync')) {
      try {
        await fileStore.syncAllFiles()
        await githubStore.updateLastCommitSha()
      } catch (syncError) {
        console.error('Sync failed:', syncError)
      }
    }
  }
}

const handleRevertAll = () => {
  notificationStore.showDialog({
    title: '确认撤销所有修改',
    message: '确定要撤销所有未提交的修改吗？此操作无法撤销。',
    type: 'warning',
    onConfirm: () => {
      fileStore.revertAllFiles()
      commitMessage.value = '' // 清空提交消息
      localStorage.removeItem(COMMIT_MESSAGE_KEY) // 清除保存的草稿
      notificationStore.showToast({
        message: 'All changes have been reverted',
        type: 'success'
      })
    }
  })
}

const handleEditDiff = (file: FileItem) => {
  fileStore.setCurrentFile(file.id)
  fileStore.setShowDiff(true)
}

const handleEditNormal = (file: FileItem) => {
  fileStore.setCurrentFile(file.id)
  fileStore.setShowDiff(false)
}
</script>
