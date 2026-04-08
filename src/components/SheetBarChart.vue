<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
import type { SheetRow } from '@/types/sheet'
import { resolveBarChartAxes } from '@/composables/useBarChartAxes'

const props = defineProps<{
  rows: SheetRow[]
  columns: string[]
  /** null 이면 자동 추론 */
  labelColumnKey: string | null
  /** null 이면 숫자 열 자동 추론 */
  valueColumnKey: string | null
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const chartModel = computed(() => {
  const axes = resolveBarChartAxes(
    props.columns,
    props.rows,
    props.labelColumnKey,
    props.valueColumnKey,
  )
  if (!axes) return null

  const { labelKey, valueKey } = axes
  const labels = props.rows.map((r) => String(r[labelKey] ?? ''))
  const data = props.rows.map((r) => {
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
  () =>
    [props.rows, props.columns, props.labelColumnKey, props.valueColumnKey] as const,
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
    <p
      v-if="!chartModel"
      class="flex flex-1 items-center justify-center text-center text-xs text-slate-500 dark:text-slate-400"
    >
      숫자로 표시할 값 열이 없어 막대 차트를 그릴 수 없습니다. 설정에서 값 열을 지정하거나, 숫자로 인식되는 열이 있는지 확인하세요.
    </p>
    <div v-else class="relative min-h-0 flex-1">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>
