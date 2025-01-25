const languageMap: Record<string, string> = {
  // 网页相关
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'scss',
  'less': 'less',
  
  // JavaScript/TypeScript
  'js': 'javascript',
  'jsx': 'javascript',
  'ts': 'typescript',
  'tsx': 'typescript',
  
  // Vue
  'vue': 'vue',
  
  // 配置文件
  'json': 'json',
  'yaml': 'yaml',
  'yml': 'yaml',
  
  // 文档
  'md': 'markdown',
  'markdown': 'markdown',
  
  // 其他
  'sh': 'shell',
  'bash': 'shell',
  'zsh': 'shell',
  'php': 'php',
  'py': 'python',
  'rb': 'ruby',
  'go': 'go',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'rs': 'rust',
}

export function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  return languageMap[ext] || 'plaintext'
}
