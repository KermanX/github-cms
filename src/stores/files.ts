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
  const currentFolder = ref<FileItem | null>(null)  // 新增当前文件夹引用

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
    // 移除 content 检查，只要是文件就可以被选中
    currentFile.value = file
    // 选择文件时不影响当前文件夹
    localStorage.setItem('current_file_path', file.path)
  }

  const selectFolder = (folder: FileItem) => {
    if (folder.type === 'tree') {
      currentFolder.value = folder
    }
  }

  const fetchFileContent = async (file: FileItem, callback?: (content: string) => void) => {
    if (file.type !== 'blob') return
    if (file.content && !file.isLoading) return
    
    // 如果是新文件，直接返回空内容
    if (file.status === FileStatus.NEW) {
      file.content = file.content || ''
      if (callback) {
        callback(file.content)
      }
      return
    }

    const githubUsername = localStorage.getItem('github_username')
    const githubRepo = localStorage.getItem('github_repository')
    const token = localStorage.getItem('github_token')

    // 立即设置加载状态
    file.isLoading = true
    file.content = '加载中...'

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3.raw'
    }
    
    if (token) {
      headers['Authorization'] = `token ${token}`
    }

    try {
      const response = await axios.get(
        `https://api.github.com/repos/${githubUsername}/${githubRepo}/contents/${file.path}`,
        { headers }
      )
      const content = typeof response.data === 'string' ? response.data : ''
      
      // 检查回调时的文件状态
      file.isLoading = false
      file.content = content
      if (callback) {
        callback(content)
      }
    } catch (error) {
      file.isLoading = false
      file.content = '加载失败'
      console.error('获取文件内容失败:', error)
      throw error
    }
  }

  const updateFileContent = (fileId: number, content: string) => {
    const file = files.value.find(f => f.id === fileId)
    if (file) {
      if (file.content !== content) {
        // 保存原始内容
        if (!file.originalContent && file.status !== FileStatus.NEW) {
          file.originalContent = file.content
        }
        file.content = content
        file.isDirty = true  // 设置脏标记
        file.status = FileStatus.MODIFIED  // 设置状态为已修改
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

  const createFile = (path: string, content: string = '', type: 'blob' | 'tree' = 'blob') => {
    const newFile: FileItem = {
      id: Math.max(...files.value.map(f => f.id), 0) + 1,
      name: path.split('/').pop() || '',
      path,
      type,
      sha: '',
      content: type === 'blob' ? '' : undefined,  // 确保新文件有空字符串作为内容
      isDirty: true,
      status: FileStatus.NEW
    }
    files.value.push(newFile)
    return newFile
  }

  const deleteFile = (fileId: number) => {
    const file = files.value.find(f => f.id === fileId)
    if (file) {
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
      file.status === FileStatus.MODIFIED || 
      file.status === FileStatus.NEW || 
      file.status === FileStatus.DELETED
    )
  }

  return {
    files,
    currentFile,
    currentFolder,    // 新增
    setFiles,
    selectFile,
    selectFolder,     // 新增
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
    getModifiedFiles
  }
})
