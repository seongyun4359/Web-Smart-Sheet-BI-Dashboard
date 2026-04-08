<script setup lang="ts">
defineProps<{
  loadStatus: 'idle' | 'loading' | 'ready' | 'error'
  loadError: string | null
}>()

const emit = defineEmits<{
  'close-error': []
}>()
</script>

<template>
  <div
    v-if="loadStatus === 'loading'"
    class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    role="status"
    aria-live="polite"
  >
    <span
      class="inline-block size-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent"
      aria-hidden="true"
    />
    엑셀을 읽는 중입니다…
  </div>

  <div
    v-else-if="loadStatus === 'error' && loadError"
    class="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
    role="alert"
  >
    <p class="font-medium">불러오기 실패</p>
    <p>{{ loadError }}</p>
    <button
      type="button"
      class="self-start text-xs font-medium text-red-800 underline hover:no-underline dark:text-red-300"
      @click="emit('close-error')"
    >
      메시지 닫기
    </button>
  </div>
</template>
