<template>
  <div class="p-4 bg-white dark:bg-gray-800 rounded-lg">
    <form @submit.prevent="handleSubmit" class="space-y-4" autocomplete="on">
      <div>
        <label class="block text-sm font-medium mb-1 dark:text-gray-200" for="username">GitHub 用户名</label>
        <input 
          id="username"
          type="text"
          name="username"
          autocomplete="username"
          v-model="form.username"
          class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          placeholder="输入 GitHub 用户名"
        >
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 dark:text-gray-200" for="repository">仓库名称</label>
        <input 
          id="repository"
          type="text"
          name="repository"
          autocomplete="off"
          v-model="form.repository"
          class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          placeholder="输入仓库名称"
        >
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 dark:text-gray-200" for="token">Personal Access Token</label>
        <input 
          id="token"
          type="password"
          name="current-password"
          autocomplete="current-password"
          v-model="form.token"
          class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          placeholder="输入 GitHub Token"
        >
      </div>

      <div>
        <button 
          type="submit"
          class="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          保存配置
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useGithubStore } from '../stores/github'
import { useFileStore } from '../stores/files'

const githubStore = useGithubStore()
const fileStore = useFileStore()

const form = reactive({
  username: githubStore.username,
  repository: githubStore.repository,
  token: githubStore.token
})

const handleSubmit = async () => {
  if (!form.username || !form.repository || !form.token) {
    alert('请填写完整的配置信息')
    return
  }
  
  githubStore.setUsername(form.username)
  githubStore.setRepository(form.repository)
  githubStore.setToken(form.token)
  
  try {
    await githubStore.fetchRepoTree()
  } catch (error) {
    console.error('Failed to fetch files:', error)
    alert('获取文件失败，请检查配置是否正确')
  }
}
</script>
