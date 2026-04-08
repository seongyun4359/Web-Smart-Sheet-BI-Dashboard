<script setup lang="ts">
defineProps<{
  hasData: boolean
  rowsCount: number
  columnsCount: number
  activeSheetName: string | null
  previewTab: 'grid' | 'json'
}>()

const emit = defineEmits<{
  'update:previewTab': [value: 'grid' | 'json']
}>()
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-sm text-slate-600 dark:text-slate-400">
      <template v-if="hasData">
        <strong class="font-semibold text-slate-900 dark:text-slate-100">{{ rowsCount }}</strong>
        행 ·
        <strong class="font-semibold text-slate-900 dark:text-slate-100">{{ columnsCount }}</strong>
        열
        <span v-if="activeSheetName" class="text-slate-500 dark:text-slate-500">
          · 시트 「{{ activeSheetName }}」
        </span>
      </template>
      <template v-else>데이터가 없습니다. 파일을 업로드하거나 샘플을 불러오세요.</template>
    </p>
    <div
      v-if="hasData"
      class="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700"
      role="tablist"
      aria-label="보기 전환"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="previewTab === 'grid'"
        class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
        :class="
          previewTab === 'grid'
            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        "
        @click="emit('update:previewTab', 'grid')"
      >
        표 (AG Grid)
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="previewTab === 'json'"
        class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
        :class="
          previewTab === 'json'
            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
        "
        @click="emit('update:previewTab', 'json')"
      >
        JSON 미리보기
      </button>
    </div>
  </div>
</template>
