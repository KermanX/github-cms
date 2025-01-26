import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export enum FileStatus {
  UNMODIFIED = 'unmodified',
  MODIFIED = 'modified',
  NEW = 'new',
  DELETED = 'deleted'  // 新增删除状态
}

export interface FileItem {
  id: number
  name: string
  path: string
  type: string
  sha: string
  content?: string
  children?: FileItem[]
  isDirty?: boolean  // 新增脏标记
  status?: FileStatus
  originalContent?: string    // 原始内容
  isDeleted?: boolean        // 删除标记
  isLoading?: boolean
}

export const useFileStore = defineStore('files', () => {
  const files = ref<FileItem[]>([])
  const currentFile = ref<FileItem | null>(null)
  const focusedItem = ref<FileItem | null>(null)  // 替换 currentFolder
  const showDiff = ref(false)

  // 从 localStorage 恢复当前文件
  const restoreCurrentFile = () => {
    const savedFilePath = localStorage.getItem('current_file_path')
    if (savedFilePath) {
      const file = files.value.find(f => f.path === savedFilePath)
      if (file) {
        currentFile.value = file
        return true
      }
    }
    // 如果没有保存的文件或找不到保存的文件，尝试使用 README.md
    const readmeFile = files.value.find(f => 
      f.name.toLowerCase() === 'readme.md' && f.type === 'blob'
    )
    if (readmeFile) {
      currentFile.value = readmeFile
      return true
    }
    return false
  }

  const setFiles = (newFiles: FileItem[]) => {
    files.value = newFiles
    // 在设置文件后尝试恢复当前文件
    restoreCurrentFile()
  }

  const selectFile = (file: FileItem) => {
    currentFile.value = file
    focusedItem.value = file  // 更新焦点项
    localStorage.setItem('current_file_path', file.path)
  }

  const setFocusedItem = (item: FileItem) => {
    focusedItem.value = item
    // 保存焦点项路径
    localStorage.setItem('focused_item_path', item.path)
  }

  const restoreFocusedItem = () => {
    const savedPath = localStorage.getItem('focused_item_path')
    if (savedPath) {
      const item = files.value.find(f => f.path === savedPath)
      if (item) {
        focusedItem.value = item
        return item
      }
    }
    return null
  }

  // 获取GitHub上的文件内容
  const fetchGithubContent = async (path: string) => {
    const githubUsername = localStorage.getItem('github_username')
    const githubRepo = localStorage.getItem('github_repository')
    const token = localStorage.getItem('github_token')

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3.raw'
    }
    
    if (token) {
      headers['Authorization'] = `token ${token}`
    }

    try {
      const response = await axios.get(
        `https://api.github.com/repos/${githubUsername}/${githubRepo}/contents/${path}`,
        { headers }
      )
      return typeof response.data === 'string' ? response.data : ''
    } catch (error) {
      console.error('获取GitHub文件内容失败:', error)
      return null
    }
  }

  // 同步检查文件内容
  const syncFileContent = async (file: FileItem) => {
    if (file.type !== 'blob' || file.status === FileStatus.NEW) return

    const githubContent = await fetchGithubContent(file.path)
    if (githubContent === null) return // 获取失败则不进行同步

    // 如果文件还没有加载过内容，直接使用GitHub的内容
    if (!file.content) {
      file.content = githubContent
      return
    }

    // 如果内容不一致，且本地没有修改，则更新本地内容
    if (file.content !== githubContent && !file.isDirty) {
      file.content = githubContent
      return
    }

    // 如果内容不一致，且本地有修改，则保存GitHub内容为原始内容
    if (file.content !== githubContent && file.isDirty) {
      file.originalContent = githubContent
      file.status = FileStatus.MODIFIED
    }
  }

  const fetchFileContent = async (file: FileItem, callback?: (content: string) => void) => {
    if (file.type !== 'blob') return
    if (file.content && !file.isLoading) {
      // 即使有内容，也进行同步检查
      await syncFileContent(file)
      if (callback) {
        callback(file.content)
      }
      return
    }
    
    // 如果是新文件，直接返回空内容
    if (file.status === FileStatus.NEW) {
      file.content = file.content || ''
      if (callback) {
        callback(file.content)
      }
      return
    }

    // 立即设置加载状态
    file.isLoading = true
    file.content = '加载中...'

    try {
      const githubContent = await fetchGithubContent(file.path)
      if (githubContent !== null) {
        file.content = githubContent
        if (callback) {
          callback(githubContent)
        }
      }
    } finally {
      file.isLoading = false
    }
  }

  // 获取持久化存储的key
  const getPersistKey = () => {
    const username = localStorage.getItem('github_username')
    const repo = localStorage.getItem('github_repository')
    if (!username || !repo) return null
    return `files_${username.toLowerCase()}_${repo.toLowerCase()}`
  }

  // 保存文件数据到localStorage
  const persistFiles = () => {
    const key = getPersistKey()
    if (!key) return

    const filesToSave = files.value.map(file => ({
      ...file,
      isLoading: false // 不保存加载状态
    }))
    localStorage.setItem(key, JSON.stringify(filesToSave))
  }

  // 从localStorage加载文件数据
  const loadPersistedFiles = () => {
    const key = getPersistKey()
    if (!key) return false

    const savedData = localStorage.getItem(key)
    if (savedData) {
      try {
        const parsedFiles = JSON.parse(savedData)
        files.value = parsedFiles
        return true
      } catch (e) {
        console.error('Failed to parse persisted files:', e)
      }
    }
    return false
  }

  const updateFileContent = (fileId: number, content: string) => {
    const file = files.value.find(f => f.id === fileId)
    if (file) {
      if (file.content !== content) {
        // 如果是新文件，直接更新内容
        if (file.status === FileStatus.NEW) {
          file.content = content
          file.isDirty = true
          persistFiles()
          return
        }

        // 保存原始内容（如果还没有保存过）
        if (!file.originalContent) {
          file.originalContent = file.content
        }

        // 更新内容
        file.content = content

        // 检查是否与原始内容相同
        if (file.content === file.originalContent) {
          // 恢复到原始状态
          file.isDirty = false
          file.status = FileStatus.UNMODIFIED
          file.originalContent = undefined
        } else {
          // 内容有变化
          file.isDirty = true
          file.status = FileStatus.MODIFIED
        }

        persistFiles()
      }
    }
  }

  const markFileAsDirty = (fileId: number) => {
    const file = files.value.find(f => f.id === fileId)
    if (file) {
      file.isDirty = true
    }
  }

  const clearDirtyFlag = (fileId: number) => {
    const file = files.value.find(f => f.id === fileId)
    if (file) {
      file.isDirty = false
    }
  }

  const getDirtyFiles = () => {
    return files.value.filter(file => file.isDirty)
  }

  const addNewFile = (file: Omit<FileItem, 'status' | 'isDirty'>) => {
    const newFile = {
      ...file,
      isDirty: true,
      status: FileStatus.NEW
    }
    files.value.push(newFile as FileItem)
  }

  const getParentPath = (path: string) => {
    const parts = path.split('/')
    return parts.slice(0, -1).join('/')
  }

  const normalizeFilePath = (path: string) => {
    // Remove leading/trailing slashes and normalize multiple slashes
    return path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
  }

  const createFile = (path: string, content: string = '', type: 'blob' | 'tree' = 'blob') => {
    const normalizedPath = normalizeFilePath(path)
    const newFile: FileItem = {
      id: Math.max(...files.value.map(f => f.id), 0) + 1,
      name: normalizedPath.split('/').pop() || '',
      path: normalizedPath,
      type,
      sha: '',
      content: type === 'blob' ? content : undefined,
      isDirty: true,
      status: FileStatus.NEW
    }
    files.value.push(newFile)
    persistFiles() // 保存更改
    return newFile
  }

  const deleteFile = (fileId: number) => {
    const file = files.value.find(f => f.id === fileId)
    if (!file) return
  
    // 如果是文件夹，递归删除所有子文件和子文件夹
    if (file.type === 'tree') {
      const deletePath = file.path
      // 找出所有以此路径开头的文件和文件夹
      files.value.forEach(f => {
        if (f.path === deletePath || f.path.startsWith(deletePath + '/')) {
          if (f.status === FileStatus.NEW) {
            // 新建的文件直接移除
            files.value = files.value.filter(item => item.id !== f.id)
          } else {
            // 已存在的文件标记为删除
            f.isDeleted = true
            f.isDirty = true
            f.status = FileStatus.DELETED
          }
        }
      })
    } else {
      // 单个文件的删除逻辑
      if (file.status === FileStatus.NEW) {
        // 如果是新建的文件，直接移除
        files.value = files.value.filter(f => f.id !== fileId)
      } else {
        // 已存在的文件，标记为删除
        file.isDeleted = true
        file.isDirty = true
        file.status = FileStatus.DELETED
      }
    }
    
    persistFiles() // 保存更改
  }

  const revertFile = (fileId: number) => {
    const file = files.value.find(f => f.id === fileId)
    if (file) {
      if (file.status === FileStatus.NEW) {
        // 新文件直接删除
        files.value = files.value.filter(f => f.id !== fileId)
      } else if (file.originalContent !== undefined) {
        // 恢复原始内容
        file.content = file.originalContent
        file.originalContent = undefined
        file.isDirty = false
        file.status = FileStatus.UNMODIFIED
        file.isDeleted = false
      }
    }
  }

  const getModifiedFiles = () => {
    return files.value.filter(file => 
      // 只返回文件类型(blob)且有修改状态的项目
      file.type === 'blob' && (
        file.status === FileStatus.MODIFIED || 
        file.status === FileStatus.NEW || 
        file.status === FileStatus.DELETED
      )
    ).map(file => ({
      ...file,
      path: normalizeFilePath(file.path)
    })).sort((a, b) => {
      const statusOrder = {
        [FileStatus.NEW]: 0,
        [FileStatus.MODIFIED]: 1,
        [FileStatus.DELETED]: 2
      }
      return (statusOrder[a.status!] || 0) - (statusOrder[b.status!] || 0)
    })
  }

  const updateFileOriginalContent = () => {
    files.value.forEach(file => {
      if (file.status === FileStatus.NEW) {
        // 新文件提交后应该变为未修改状态
        file.status = FileStatus.UNMODIFIED
        file.isDirty = false
        file.originalContent = file.content
      } else if (file.status === FileStatus.MODIFIED) {
        // 修改的文件提交后，更新原始内容
        file.status = FileStatus.UNMODIFIED
        file.isDirty = false
        file.originalContent = file.content
      } else if (file.status === FileStatus.DELETED) {
        // 删除的文件提交后应该从列表中移除
        files.value = files.value.filter(f => f.id !== file.id)
      }
    })
    persistFiles()
  }

  const syncAllFiles = async () => {
    const blobFiles = files.value.filter(f => f.type === 'blob')
    for (const file of blobFiles) {
      await syncFileContent(file)
    }
    persistFiles()
  }

  const revertAllFiles = () => {
    // 获取所有已修改的文件
    const modifiedFiles = getModifiedFiles()
    
    modifiedFiles.forEach(file => {
      if (file.status === FileStatus.NEW) {
        // 新文件直接从列表中移除
        files.value = files.value.filter(f => f.id !== file.id)
      } else {
        // 恢复原始内容
        const originalFile = files.value.find(f => f.id === file.id)
        if (originalFile) {
          originalFile.content = originalFile.originalContent
          originalFile.originalContent = undefined
          originalFile.isDirty = false
          originalFile.status = FileStatus.UNMODIFIED
          originalFile.isDeleted = false
        }
      }
    })
    
    persistFiles() // 保存更改
  }

  const setShowDiff = (value: boolean) => {
    showDiff.value = value
  }

  const setCurrentFile = (fileId: number | null) => {
    if (fileId === null) {
      currentFile.value = null
      return
    }
    const file = files.value.find(f => f.id === fileId)
    if (file) {
      currentFile.value = file
      focusedItem.value = file
      localStorage.setItem('current_file_path', file.path)
    }
  }

  return {
    files,
    currentFile,
    focusedItem,    // 替换 currentFolder
    setFiles,
    selectFile,
    setFocusedItem, // 新增
    restoreCurrentFile,
    fetchFileContent,
    updateFileContent,
    markFileAsDirty,   // 新增
    clearDirtyFlag,    // 新增
    getDirtyFiles,     // 新增
    addNewFile,
    createFile,
    deleteFile,
    revertFile,
    getModifiedFiles,
    persistFiles,
    loadPersistedFiles,
    syncFileContent,   // 新增
    updateFileOriginalContent,
    syncAllFiles,
    restoreFocusedItem, // 新增
    revertAllFiles, // 添加到返回对象
    showDiff,
    setShowDiff,
    setCurrentFile,
  }
})
