import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useFileStore } from './files'

export const useGithubStore = defineStore('github', () => {
  // 使用 ref 存储状态，方便持久化
  const username = ref(localStorage.getItem('github_username') || '')
  const repository = ref(localStorage.getItem('github_repository') || '')
  const token = ref(localStorage.getItem('github_token') || '')

  // 更新方法
  const setUsername = (newUsername: string) => {
    username.value = newUsername
    localStorage.setItem('github_username', newUsername)
  }

  const setRepository = (newRepository: string) => {
    repository.value = newRepository
    localStorage.setItem('github_repository', newRepository)
  }

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('github_token', newToken)
  }

  // 清除所有 GitHub 相关数据
  const clearGithubData = () => {
    username.value = ''
    repository.value = ''
    token.value = ''
    localStorage.removeItem('github_username')
    localStorage.removeItem('github_repository')
    localStorage.removeItem('github_token')
  }

  const fetchRepoTree = async () => {
    if (!username.value || !repository.value) {
      throw new Error('请先设置用户名和仓库名')
    }

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    }
    
    if (token.value) {
      headers['Authorization'] = `token ${token.value}`
    }

    try {
      const response = await axios.get(
        `https://api.github.com/repos/${username.value}/${repository.value}/git/trees/main?recursive=1`,
        { headers }
      )

      const fileStore = useFileStore()
      const treeData = response.data.tree.map((item: any, index: number) => ({
        id: index + 1,
        name: item.path.split('/').pop(),
        path: item.path,
        type: item.type,
        sha: item.sha,
        content: item.type === 'blob' ? '' : undefined
      }))

      fileStore.setFiles(treeData)
      return treeData
    } catch (error) {
      console.error('获取仓库目录失败:', error)
      throw error
    }
  }

  const isConfigured = computed(() => {
    return Boolean(username.value && repository.value && token.value)
  })

  return {
    username,
    repository,
    token,
    setUsername,
    setRepository,
    setToken,
    clearGithubData,
    fetchRepoTree,
    isConfigured
  }
})
