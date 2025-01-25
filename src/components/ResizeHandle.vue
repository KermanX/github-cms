<template>
  <div
    class="absolute right-0 top-0 h-full w-1 hover:w-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 cursor-col-resize z-50 translate-x-1/2"
    @mousedown="startResize"
  ></div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'resize', width: number): void
}>()

const startResize = (e: MouseEvent) => {
  const startX = e.clientX
  const startWidth = (e.target as HTMLElement).previousElementSibling?.offsetWidth || 250

  function onMouseMove(e: MouseEvent) {
    const newWidth = startWidth + e.clientX - startX
    emit('resize', newWidth)
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<style scoped>
.resize-handle {
  position: relative;
  z-index: 100;
  touch-action: none;
  -webkit-user-select: none;
  user-select: none;
}
</style>
