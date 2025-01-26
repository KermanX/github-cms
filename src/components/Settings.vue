<template>
  <div class="p-4 bg-white dark:bg-gray-800 rounded-lg">
    <form @submit.prevent="handleSubmit" class="space-y-4" autocomplete="on">
      <div>
        <label class="block text-sm font-medium mb-1 dark:text-gray-200" for="username">GitHub 用户名</label>
        <input 
          id="username"
          type="text"
          name="username"
          v-model="form.username"
          :disabled="!!envUsername"
          class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 disabled:opacity-60"
          placeholder="输入 GitHub 用户名"
        >
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 dark:text-gray-200" for="repository">仓库名称</label>
        <input 
          id="repository"
          type="text"
          name="repository"
          v-model="form.repository"
          :disabled="!!envRepository"
          class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 disabled:opacity-60"
          placeholder="输入仓库名称"
        >
      </div>

      <div>
        <label class="block text-sm font-medium mb-1 dark:text-gray-200" for="token">Personal Access Token</label>
        <input 
          id="token"
          type="password"
          name="password"
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
          进入
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useGithubStore } from '../stores/github'

const githubStore = useGithubStore()
const envUsername = import.meta.env.VITE_GITHUB_USERNAME
const envRepository = import.meta.env.VITE_GITHUB_REPO

const form = reactive({
  username: envUsername || githubStore.username,
  repository: envRepository || githubStore.repository,
  token: githubStore.token
})

onMounted(() => {
  if (envUsername) {
    githubStore.setUsername(envUsername)
  }
  if (envRepository) {
    githubStore.setRepository(envRepository)
  }
})

const handleSubmit = async () => {
  if (!form.username || !form.repository || !form.token) {
    alert('请填写完整的配置信息')
    return
  }

  try {
    // 先获取仓库信息以确认正确的大小写
    const response = await fetch(`https://api.github.com/repos/${form.username}/${form.repository}`, {
      headers: {
        'Authorization': `Bearer ${form.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (!response.ok) {
      throw new Error('仓库信息获取失败')
    }

    const repoInfo = await response.json()
    
    // 使用 API 返回的准确用户名和仓库名
    const correctUsername = repoInfo.owner.login
    const correctRepository = repoInfo.name
    
    // 更新 store 和本地存储
    githubStore.setUsername(correctUsername)
    githubStore.setRepository(correctRepository)
    githubStore.setToken(form.token)
    
    // 更新表单显示
    form.username = correctUsername
    form.repository = correctRepository
    
    await githubStore.fetchRepoTree()
  } catch (error) {
    console.error('Failed to fetch repository:', error)
    alert('获取仓库信息失败，请检查配置是否正确')
  }
}
</script>
