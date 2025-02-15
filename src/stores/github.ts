/// <reference types="vite/client" />

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useFileStore } from './files'

export const useGithubStore = defineStore('github', () => {
  const username = import.meta.env.VITE_GITHUB_USERNAME
  const repository = import.meta.env.VITE_GITHUB_REPO
  const token = ref(localStorage.getItem('github_token') || '')

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('github_token', newToken)
  }

  const clearGithubData = () => {
    token.value = ''
    localStorage.removeItem('github_token')
  }

  const fetchRepoTree = async () => {
    if (!username || !repository) {
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
        `https://api.github.com/repos/${username}/${repository}/git/trees/main?recursive=1`,
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

  const createBlob = async (content: string) => {
    const response = await axios.post(
      `https://api.github.com/repos/${username}/${repository}/git/blobs`,
      { content, encoding: 'utf-8' },
      { headers: { Authorization: `token ${token.value}` } }
    )
    return response.data.sha
  }

  const getReference = async () => {
    const response = await axios.get(
      `https://api.github.com/repos/${username}/${repository}/git/ref/heads/main`,
      { headers: { Authorization: `token ${token.value}` } }
    )
    return {
      sha: response.data.object.sha,
      ref: response.data.ref
    }
  }

  const createTree = async (baseTree: string, files: { path: string; sha: string; mode: string }[]) => {
    const response = await axios.post(
      `https://api.github.com/repos/${username}/${repository}/git/trees`,
      {
        base_tree: baseTree,
        tree: files
      },
      { headers: { Authorization: `token ${token.value}` } }
    )
    return response.data.sha
  }

  const createCommit = async (message: string, treeSha: string, parentSha: string) => {
    const response = await axios.post(
      `https://api.github.com/repos/${username}/${repository}/git/commits`,
      {
        message,
        tree: treeSha,
        parents: [parentSha],
        author: {
          name: 'GitHub-CMS',
          email: 'github-cms@noreply.github.com',
          date: new Date().toISOString()
        }
      },
      { headers: { Authorization: `token ${token.value}` } }
    )
    return response.data.sha
  }

  const updateReference = async (ref: string, sha: string) => {
    await axios.patch(
      `https://api.github.com/repos/${username}/${repository}/git/${ref}`,
      { sha },
      { headers: { Authorization: `token ${token.value}` } }
    )
  }

  const commitAndPush = async (message: string, changes: Array<{
    path: string;
    content?: string;
    isDeleted?: boolean;
  }>) => {
    if (isReadonly.value) {
      throw new Error('当前处于只读模式，无法进行版本控制操作')
    }
    try {
      await attemptCommit(message, changes)
      return true
    } catch (error: any) {
      // 检查是否是需要先拉取的错误
      if (error?.response?.data?.message?.includes('Update is not a fast-forward')) {
        try {
          // 先拉取最新代码
          const fileStore = useFileStore()
          await fileStore.syncAllFiles()
          
          // 重试提交
          await attemptCommit(message, changes)
          return true
        } catch (retryError) {
          console.error('Retry commit failed:', retryError)
          throw retryError
        }
      }
      throw error
    }
  }

  const attemptCommit = async (message: string, changes: Array<{
    path: string;
    content?: string;
    isDeleted?: boolean;
  }>) => {
    // 1. 为所有修改的文件创建 blob
    const blobPromises = changes
      .filter(f => !f.isDeleted && f.content !== undefined)
      .map(async file => ({
        path: file.path,
        sha: await createBlob(file.content!)
      }))
    
    const blobs = await Promise.all(blobPromises)

    // 2. 获取当前 reference
    const { sha: parentSha, ref } = await getReference()

    // 3. 创建新的 tree
    const tree = changes.map(file => {
      if (file.isDeleted) {
        return {
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: null
        }
      }
      const blob = blobs.find(b => b.path === file.path)
      return {
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blob!.sha
      }
    })

    const newTreeSha = await createTree(parentSha, tree)

    // 4. 创建 commit
    const newCommitSha = await createCommit(message, newTreeSha, parentSha)

    // 5. 更新 reference
    await updateReference(ref, newCommitSha)
  }

  const fetchGithubContent = async (path: string) => {
    if (!username || !repository) {
      throw new Error('请先设置用户名和仓库名')
    }

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3.raw'
    }
    
    if (token.value) {
      headers['Authorization'] = `token ${token.value}`
    }

    try {
      const response = await axios.get(
        `https://api.github.com/repos/${username}/${repository}/contents/${path}`,
        { headers }
      )
      return typeof response.data === 'string' ? response.data : ''
    } catch (error) {
      console.error('获取GitHub文件内容失败:', error)
      return null
    }
  }

  const isConfigured = computed(() => {
    return Boolean(username && repository)
  })

  const isReadonly = computed(() => {
    return !token.value
  })

  return {
    username,
    repository,
    token,
    setToken,
    clearGithubData,
    fetchRepoTree,
    isConfigured,
    isReadonly,
    fetchGithubContent,
    commitAndPush
  }
})
