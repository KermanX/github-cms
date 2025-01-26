/// <reference types="vite/client" />

import * as monaco from 'monaco-editor'
import { createHighlighter } from 'shiki'
import { shikiToMonaco } from '@shikijs/monaco'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

let initialized = false

export async function setupMonaco() {
  if (initialized) return

  
  window.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'json')
        return new JsonWorker()
      if (label === 'css' || label === 'scss' || label === 'less')
        return new CssWorker()
      if (label === 'html' || label === 'handlebars' || label === 'razor')
        return new HtmlWorker()
      if (label === 'typescript' || label === 'javascript')
        return new TsWorker()
      return new EditorWorker()
    },
  }

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
