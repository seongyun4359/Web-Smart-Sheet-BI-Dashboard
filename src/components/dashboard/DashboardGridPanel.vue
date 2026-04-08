<script setup lang="ts">
import { AgGridVue } from 'ag-grid-vue3'
import type {
  CellValueChangedEvent,
  ColDef,
  GetRowIdParams,
  GridOptions,
  GridReadyEvent,
} from 'ag-grid-community'
import { ensureAgGridRegistered } from '@/lib/ensureAgGridRegistered'
import type { SheetRow } from '@/types/sheet'

ensureAgGridRegistered()

const props = defineProps<{
  hasData: boolean
  gridKey: string
  rows: SheetRow[]
  columnDefs: ColDef[]
  defaultColDef: ColDef
  rowSelection: GridOptions<SheetRow>['rowSelection']
  getRowId: (params: GetRowIdParams<SheetRow>) => string
  selectedCount: number
  canUndo: boolean
  canRedo: boolean
  lockFirstColumn: boolean
}>()

const emit = defineEmits<{
  'update:lockFirstColumn': [value: boolean]
  'add-row': []
  'remove-selected': []
  undo: []
  redo: []
  'grid-ready': [event: GridReadyEvent<SheetRow>]
  'cell-value-changed': [event: CellValueChangedEvent]
  'selection-changed': []
}>()
</script>

<template>
  <div
    class="ag-theme-quartz min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700 lg:min-h-[560px]"
  >
    <template v-if="props.hasData">
      <div
        class="flex flex-col gap-2 border-b border-slate-200 bg-slate-50/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
      >
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            @click="emit('add-row')"
          >
            행 추가
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            :disabled="props.selectedCount === 0"
            @click="emit('remove-selected')"
          >
            선택 행 삭제
            <span v-if="props.selectedCount > 0" class="ml-1 text-violet-600 dark:text-violet-400">
              ({{ props.selectedCount }})
            </span>
          </button>
          <span class="hidden h-4 w-px bg-slate-300 sm:inline dark:bg-slate-600" aria-hidden="true" />
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            :disabled="!props.canUndo"
            title="셀 편집 실행 취소 (Ctrl+Z)"
            @click="emit('undo')"
          >
            실행 취소
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            :disabled="!props.canRedo"
            title="다시 실행 (Ctrl+Y)"
            @click="emit('redo')"
          >
            다시 실행
          </button>
        </div>
        <label class="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <input
            :checked="props.lockFirstColumn"
            type="checkbox"
            class="size-3.5 rounded border-slate-400 text-violet-600 focus:ring-violet-500"
            @change="emit('update:lockFirstColumn', ($event.target as HTMLInputElement).checked)"
          />
          첫 데이터 열 잠금 (키·코드 열용)
        </label>
      </div>
      <AgGridVue
        :key="props.gridKey"
        class="h-[380px] w-full lg:h-[520px]"
        :row-data="props.rows"
        :column-defs="props.columnDefs"
        :default-col-def="props.defaultColDef"
        :row-selection="props.rowSelection"
        :get-row-id="props.getRowId"
        :animate-rows="true"
        :single-click-edit="true"
        :stop-editing-when-cells-lose-focus="true"
        :undo-redo-cell-editing="true"
        :undo-redo-cell-editing-limit="30"
        @grid-ready="emit('grid-ready', $event)"
        @cell-value-changed="emit('cell-value-changed', $event)"
        @selection-changed="emit('selection-changed')"
      />
    </template>
    <div
      v-else
      class="flex h-[420px] flex-col items-center justify-center gap-2 bg-slate-50/80 text-center text-slate-500 lg:h-[560px] dark:bg-slate-900/40 dark:text-slate-400"
    >
      <p class="text-sm font-medium text-slate-600 dark:text-slate-300">표시할 행이 없습니다</p>
      <p class="max-w-sm text-xs">첫 행을 헤더로 쓰는 일반적인 표 형식 엑셀을 권장합니다.</p>
    </div>
  </div>
</template>
