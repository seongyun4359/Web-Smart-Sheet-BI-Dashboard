<script setup lang="ts">
const props = defineProps<{
  isDragOver: boolean
  dataSource: 'none' | 'sample' | 'file'
  fileName: string | null
  sheetNames: string[]
  activeSheetName: string | null
  exportDisabled: boolean
}>()

const emit = defineEmits<{
  'update:isDragOver': [value: boolean]
  'pick-file': []
  'load-sample': []
  export: []
  'drop-files': [event: DragEvent]
  'select-sheet': [name: string]
}>()

const setDragOver = (value: boolean) => emit('update:isDragOver', value)
</script>

<template>
  <section
    class="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
    aria-label="데이터 불러오기"
  >
    <div class="flex flex-col gap-4 lg:flex-row lg:items-stretch">
      <div
        class="flex min-h-[140px] flex-1 flex-col justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors"
        :class="
          props.isDragOver
            ? 'border-violet-500 bg-violet-50/80 dark:border-violet-400 dark:bg-violet-950/30'
            : 'border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800/30'
        "
        role="button"
        tabindex="0"
        @dragenter.prevent="setDragOver(true)"
        @dragover.prevent="setDragOver(true)"
        @dragleave.prevent="setDragOver(false)"
        @drop.prevent="emit('drop-files', $event)"
        @keydown.enter.prevent="emit('pick-file')"
        @keydown.space.prevent="emit('pick-file')"
      >
        <p class="text-sm font-medium text-slate-800 dark:text-slate-200">
          엑셀 파일을 여기에 놓거나
        </p>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">.xlsx · .xls</p>
        <button
          type="button"
          class="mx-auto mt-4 inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          @click="emit('pick-file')"
        >
          파일 선택
        </button>
      </div>

      <div class="flex flex-col justify-center gap-2 lg:w-56">
        <button
          type="button"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          @click="emit('load-sample')"
        >
          샘플 데이터
        </button>
        <button
          type="button"
          class="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-200"
          :disabled="props.exportDisabled"
          @click="emit('export')"
        >
          엑셀로보내기
        </button>
      </div>
    </div>

    <div
      v-if="props.dataSource === 'file' && props.fileName"
      class="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-700"
    >
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span class="text-slate-500 dark:text-slate-400">불러온 파일</span>
        <span
          class="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200"
          :title="props.fileName"
        >
          {{ props.fileName }}
        </span>
      </div>
      <div v-if="props.sheetNames.length > 1" class="flex flex-wrap gap-2" role="tablist" aria-label="시트 선택">
        <button
          v-for="name in props.sheetNames"
          :key="name"
          type="button"
          role="tab"
          :aria-selected="name === props.activeSheetName"
          class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            name === props.activeSheetName
              ? 'border-violet-500 bg-violet-50 text-violet-800 dark:border-violet-400 dark:bg-violet-950/40 dark:text-violet-200'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
          "
          @click="emit('select-sheet', name)"
        >
          {{ name }}
        </button>
      </div>
    </div>
  </section>
</template>
