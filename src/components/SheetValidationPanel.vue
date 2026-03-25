<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ValidationIssue } from '@/types/validation'

const props = defineProps<{
  issues: ValidationIssue[]
}>()

const expanded = ref(true)
const limit = 14

const errorCount = computed(() => props.issues.filter((i) => i.severity === 'error').length)
const warnCount = computed(() => props.issues.filter((i) => i.severity === 'warning').length)

const visible = computed(() => props.issues.slice(0, limit))
const overflow = computed(() => Math.max(0, props.issues.length - limit))

const hasProblems = computed(() => props.issues.length > 0)
const summaryTone = computed(() => {
  if (errorCount.value > 0) return 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100'
  if (warnCount.value > 0) return 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100'
  return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/25 dark:text-emerald-100'
})
</script>

<template>
  <section
    class="rounded-2xl border px-4 py-3 text-sm shadow-sm"
    :class="summaryTone"
    aria-live="polite"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 text-left font-medium"
      @click="expanded = !expanded"
    >
      <span>
        <template v-if="!hasProblems">검증 통과 — 오류 없음</template>
        <template v-else>
          데이터 검증: 오류 {{ errorCount }}건 · 경고 {{ warnCount }}건
        </template>
      </span>
      <span class="text-xs opacity-80">{{ expanded ? '접기' : '펼치기' }}</span>
    </button>
    <ul
      v-show="expanded && hasProblems"
      class="mt-3 max-h-48 space-y-1.5 overflow-y-auto border-t border-black/5 pt-3 dark:border-white/10"
    >
      <li
        v-for="(it, idx) in visible"
        :key="idx"
        class="flex flex-wrap gap-x-2 gap-y-0.5 text-xs leading-snug"
      >
        <span
          class="shrink-0 rounded px-1.5 py-0.5 font-medium"
          :class="
            it.severity === 'error'
              ? 'bg-red-200/80 text-red-900 dark:bg-red-900/50 dark:text-red-100'
              : 'bg-amber-200/70 text-amber-950 dark:bg-amber-900/40 dark:text-amber-50'
          "
          >{{ it.severity === 'error' ? '오류' : '경고' }}</span
        >
        <span v-if="it.rowIndex != null" class="text-black/60 dark:text-white/60"
          >행 {{ it.rowIndex + 1 }}</span
        >
        <span v-if="it.field" class="font-mono text-black/70 dark:text-white/70">{{ it.field }}</span>
        <span>{{ it.message }}</span>
      </li>
    </ul>
    <p v-if="expanded && overflow > 0" class="mt-2 text-xs opacity-80">외 {{ overflow }}건 (목록 상단만 표시)</p>
  </section>
</template>
