<template>
  <div class="markdown-preview h-full overflow-auto px-8 py-6">
    <div class="markdown-body" v-html="renderedContent" />
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { createHighlighter } from 'shiki'
import { computed, onMounted, ref, watch } from 'vue'
import 'github-markdown-css'
import { useDark } from '@vueuse/core';

const isDark = useDark()
const props = defineProps<{
  content: string
}>()

const md = ref<MarkdownIt>()
const renderedContent = ref('')

onMounted(async () => {
  // 初始化 shiki 高亮器
  const highlighter = await createHighlighter({
    themes: ['github-dark', 'github-light'],
    langs: ['json', 'javascript', 'typescript', 'bash', 'markdown', 'vue', 'css', 'html']
  })

  // 创建 markdown-it 实例
  md.value = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: (code, lang) => {
      try {
        return highlighter.codeToHtml(code, {
          theme: isDark.value ? 'github-dark' : 'github-light',
          lang
        } as any)
      } catch (err) {
        console.log(err)
        return code
      }
    }
  })

  // 渲染初始内容
  renderedContent.value = md.value.render(props.content)
})

// 监听 content 变化
watch(() => props.content, (newContent) => {
  if (md.value) {
    renderedContent.value = md.value.render(newContent)
  }
})
</script>

<style>
.markdown-preview {
  background-color: #ffffff;
}

.dark .markdown-preview {
  background-color: #0d1117;
}

.dark .markdown-body {
  color-scheme: dark;
  --color-prettylights-syntax-comment: #8b949e;
  --color-prettylights-syntax-constant: #79c0ff;
  --color-prettylights-syntax-entity: #d2a8ff;
  --color-prettylights-syntax-storage-modifier-import: #c9d1d9;
  --color-prettylights-syntax-entity-tag: #7ee787;
  --color-prettylights-syntax-keyword: #ff7b72;
  --color-prettylights-syntax-string: #a5d6ff;
  --color-prettylights-syntax-variable: #ffa657;
  --color-prettylights-syntax-brackethighlighter-unmatched: #f85149;
  --color-prettylights-syntax-invalid-illegal-text: #f0f6fc;
  --color-prettylights-syntax-invalid-illegal-bg: #8e1519;
  --color-prettylights-syntax-carriage-return-text: #f0f6fc;
  --color-prettylights-syntax-carriage-return-bg: #b62324;
  --color-prettylights-syntax-string-regexp: #7ee787;
  --color-prettylights-syntax-markup-list: #f2cc60;
  --color-prettylights-syntax-markup-heading: #1f6feb;
  --color-prettylights-syntax-markup-italic: #c9d1d9;
  --color-prettylights-syntax-markup-bold: #c9d1d9;
  --color-prettylights-syntax-markup-deleted-text: #ffdcd7;
  --color-prettylights-syntax-markup-deleted-bg: #67060c;
  --color-prettylights-syntax-markup-inserted-text: #aff5b4;
  --color-prettylights-syntax-markup-inserted-bg: #033a16;
  --color-prettylights-syntax-markup-changed-text: #ffdfb6;
  --color-prettylights-syntax-markup-changed-bg: #5a1e02;
  --color-prettylights-syntax-markup-ignored-text: #c9d1d9;
  --color-prettylights-syntax-markup-ignored-bg: #1158c7;
  --color-prettylights-syntax-meta-diff-range: #d2a8ff;
  --color-prettylights-syntax-brackethighlighter-angle: #8b949e;
  --color-prettylights-syntax-sublimelinter-gutter-mark: #484f58;
  --color-prettylights-syntax-constant-other-reference-link: #a5d6ff;
  --color-fg-default: #c9d1d9;
  --color-fg-muted: #8b949e;
  --color-fg-subtle: #484f58;
  --color-canvas-default: #0d1117;
  --color-canvas-subtle: #161b22;
  --color-border-default: #30363d;
  --color-border-muted: #21262d;
  --color-neutral-muted: rgba(110, 118, 129, 0.4);
  --color-accent-fg: #58a6ff;
  --color-accent-emphasis: #1f6feb;
  --color-attention-subtle: rgba(187, 128, 9, 0.15);
  --color-danger-fg: #f85149;
}

.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  margin: 0 auto;
}

/* 自定义滚动条样式 */
.markdown-preview::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.markdown-preview::-webkit-scrollbar-track {
  background: transparent;
}

.markdown-preview::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 6px;
  border: 3px solid transparent;
  background-clip: content-box;
}

.dark .markdown-preview::-webkit-scrollbar-thumb {
  background-color: #4b5563;
}

.markdown-preview::-webkit-scrollbar-thumb:hover {
  background-color: #9ca3af;
}

.dark .markdown-preview::-webkit-scrollbar-thumb:hover {
  background-color: #6b7280;
}
</style>
