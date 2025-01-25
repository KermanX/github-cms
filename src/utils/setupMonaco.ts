import * as monaco from 'monaco-editor'
import { createHighlighter } from 'shiki'
import { shikiToMonaco } from '@shikijs/monaco'

let initialized = false

export async function setupMonaco() {
  if (initialized) return

  const highlighter = await createHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: [
      'markdown',
      'javascript',
      'typescript',
      'html',
      'css',
      'vue',
      'json',
      'yaml',
      'bash'
    ]
  })

  // 注册所有需要的语言
  const languages = [
    'markdown',
    'javascript',
    'typescript',
    'html',
    'css',
    'vue',
    'json',
    'yaml',
    'bash'
  ]
  languages.forEach(lang => {
    monaco.languages.register({ id: lang })
  })

  // 注册 Shiki 主题到 Monaco
  await shikiToMonaco(highlighter, monaco)
  
  initialized = true
}
