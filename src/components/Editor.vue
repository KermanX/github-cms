<template>
  <div class="h-full">
    <div ref="editorContainer" class="h-full"></div>
  </div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import { useFileStore } from '../stores/files.ts'
import { useDark } from '@vueuse/core'
import { setupMonaco } from '../utils/setupMonaco.ts'
import { getLanguageFromFileName } from '../utils/languageMap.ts'

const props = defineProps<{
  content: string
}>()

const fileStore = useFileStore()
const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
const isDark = useDark()

const currentLanguage = computed(() => {
  const currentFile = fileStore.currentFile
  return currentFile
    ? getLanguageFromFileName(currentFile.path)
    : 'markdown'
})

onMounted(async () => {
  // 确保 Monaco-Shiki 已设置
  await setupMonaco()

  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: props.content,
      language: currentLanguage.value,
      theme: isDark.value ? 'github-dark' : 'github-light',
      automaticLayout: true,
      minimap: { enabled: false },
      wordWrap: 'on',
      wrappingIndent: 'indent',
      wordWrapColumn: 80,
      padding: { top: 16 },
      fontSize: 14,
      fontFamily: '"Fira Code", Consolas, "Courier New", monospace',
      renderWhitespace: 'selection'
    })

    // 监听编辑器内容变化
    editor.onDidChangeModelContent(() => {
      if (editor && fileStore.currentFile) {
        const content = editor.getValue()
        fileStore.updateFileContent(fileStore.currentFile.id, content)
      }
    })
  }
})

// 修改内容监听，避免循环更新
watch(() => props.content, (newContent) => {
  console.log('Editor content updating to:', newContent) // 调试日志
  if (editor) {
    const currentContent = editor.getValue()
    // 只有当内容真的不同时才更新
    if (currentContent !== newContent) {
      const position = editor.getPosition() // 保存光标位置
      editor.setValue(newContent)
      if (position) {
        editor.setPosition(position) // 恢复光标位置
      }
    }
  }
}, { immediate: true })

// 修改主题切换逻辑
watch(isDark, (newIsDark) => {
  if (editor) {
    monaco.editor.setTheme(newIsDark ? 'github-dark' : 'github-light')
  }
})

// 监听文件变化时更新语言
watch(() => currentLanguage.value, (newLanguage) => {
  if (editor) {
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, newLanguage)
    }
  }
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
  }
})
</script>

<style scoped>
/* 确保编辑器填满容器 */
</style>