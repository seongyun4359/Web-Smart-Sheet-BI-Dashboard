<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
import type { SheetRow } from '@/types/sheet'
import { inferSheetColumnKind } from '@/composables/useSheetColumnKind'

const props = defineProps<{
  rows: SheetRow[]
  columns: string[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const chartModel = computed(() => {
  const cols = props.columns
  const rows = props.rows
  if (cols.length === 0 || rows.length === 0) return null

  const labelKey =
    cols.find((c) => inferSheetColumnKind(c, rows) !== 'number') ?? cols[0]
  const valueKey = cols.find((c) => inferSheetColumnKind(c, rows) === 'number')
  if (!valueKey) return null

  const labels = rows.map((r) => String(r[labelKey] ?? ''))
  const data = rows.map((r) => {
    const v = r[valueKey]
    if (typeof v === 'number' && Number.isFinite(v)) return v
    const n = Number(String(v ?? '').replace(/,/g, ''))
    return Number.isFinite(n) ? n : 0
  })

  return { labels, data, labelKey, valueKey }
})

function draw() {
  const el = canvasRef.value
  if (!el) return

  const m = chartModel.value
  chart?.destroy()
  chart = null
  if (!m) return

  chart = new Chart(el, {
    type: 'bar',
    data: {
      labels: m.labels,
      datasets: [
        {
          label: `${m.valueKey} (합계 시각화)`,
          data: m.data,
          backgroundColor: 'rgba(139, 92, 246, 0.45)',
          borderColor: 'rgb(124, 58, 237)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  })
}

onMounted(draw)
watch(
  () => [props.rows, props.columns] as const,
  () => draw(),
  { deep: true },
)
onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div
    class="flex h-64 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50"
  >
    <h2 class="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">차트 (Pinia 동기화)</h2>
    <p v-if="!chartModel" class="flex flex-1 items-center justify-center text-center text-xs text-slate-500 dark:text-slate-400">
      숫자형으로 추정된 열이 없어 막대 차트를 그릴 수 없습니다.
    </p>
    <div v-else class="relative min-h-0 flex-1">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>
