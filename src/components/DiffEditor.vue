<template>
  <div class="h-full">
    <div ref="diffEditorContainer" class="h-full"></div>
  </div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useDark } from '@vueuse/core'
import { setupMonaco } from '../utils/setupMonaco'
import { useFileStore } from '../stores/files'
import { getLanguageFromFileName } from '../utils/languageMap'

const props = defineProps<{
  originalContent: string
  modifiedContent: string
  filePath: string
}>()

const emit = defineEmits<{
  (e: 'change', content: string): void
}>()

const fileStore = useFileStore()
const diffEditorContainer = ref<HTMLElement | null>(null)
let diffEditor: monaco.editor.IStandaloneDiffEditor | null = null
const isDark = useDark()

onMounted(async () => {
  await setupMonaco()

  if (diffEditorContainer.value) {
    diffEditor = monaco.editor.createDiffEditor(diffEditorContainer.value, {
      theme: isDark.value ? 'github-dark' : 'github-light',
      automaticLayout: true,
      minimap: { enabled: false },
      wordWrap: 'on',
      renderSideBySide: true,
      readOnly: false,
      wordWrapColumn: 80,
      padding: { top: 16 },
      fontSize: 14,
      fontFamily: '"Fira Code", Consolas, "Courier New", monospace',
    })

    const language = getLanguageFromFileName(props.filePath)
    
    const originalModel = monaco.editor.createModel(
      props.originalContent,
      language
    )
    const modifiedModel = monaco.editor.createModel(
      props.modifiedContent,
      language
    )

    diffEditor.setModel({
      original: originalModel,
      modified: modifiedModel
    })

    // Listen for changes in the modified editor
    modifiedModel.onDidChangeContent(() => {
      emit('change', modifiedModel.getValue())
    })
  }
})

watch(() => props.modifiedContent, (newContent) => {
  if (diffEditor) {
    const modifiedModel = diffEditor.getModifiedEditor().getModel()
    if (modifiedModel && modifiedModel.getValue() !== newContent) {
      const position = diffEditor.getModifiedEditor().getPosition()
      modifiedModel.setValue(newContent)
      if (position) {
        diffEditor.getModifiedEditor().setPosition(position)
      }
    }
  }
})

watch(isDark, (newIsDark) => {
  if (diffEditor) {
    monaco.editor.setTheme(newIsDark ? 'github-dark' : 'github-light')
  }
})

onBeforeUnmount(() => {
  if (diffEditor) {
    diffEditor.dispose()
  }
})
</script>
