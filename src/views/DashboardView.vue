<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { exportRowsToXlsxFile } from '@/lib/sheetXlsx'
import SheetBarChart from '@/components/SheetBarChart.vue'
import SheetValidationPanel from '@/components/SheetValidationPanel.vue'
import DashboardDataLoader from '@/components/dashboard/DashboardDataLoader.vue'
import DashboardGridPanel from '@/components/dashboard/DashboardGridPanel.vue'
import DashboardJsonPreview from '@/components/dashboard/DashboardJsonPreview.vue'
import DashboardPreviewHeader from '@/components/dashboard/DashboardPreviewHeader.vue'
import DashboardStatusBanner from '@/components/dashboard/DashboardStatusBanner.vue'
import { validateSheetData } from '@/composables/useSheetValidation'
import type {
  CellValueChangedEvent,
  ColDef,
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community'
import type { SheetRow } from '@/types/sheet'
import { SHEET_ROW_ID_KEY, stripSheetRowMeta } from '@/types/sheet'
import { inferSheetColumnKind } from '@/composables/useSheetColumnKind'
import { useSettingsStore } from '@/store/settings'
import { useSheetStore } from '@/store/sheet'

const sheet = useSheetStore()
const settings = useSettingsStore()
const {
  rows,
  columns,
  loadStatus,
  loadError,
  dataSource,
  fileName,
  sheetNames,
  activeSheetName,
} = storeToRefs(sheet)
const { appTitle, lockFirstColumnByDefault, chartLabelColumn, chartValueColumn } =
  storeToRefs(settings)

const { clearError, loadSample, loadExcelFile, selectSheet, addEmptyRow, removeRows } = sheet

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const previewTab = ref<'grid' | 'json'>('grid')
const lockFirstColumn = ref(lockFirstColumnByDefault.value)

const gridApi = ref<GridApi<SheetRow> | null>(null)
const toolbarTick = ref(0)
const bumpToolbar = () => {
  toolbarTick.value += 1
}

const rowSelection = {
  mode: 'multiRow' as const,
  checkboxes: true,
  headerCheckbox: true,
  enableClickSelection: true,
}

const gridKey = computed(
  () =>
    `${dataSource.value}:${fileName.value ?? ''}:${activeSheetName.value ?? ''}:${columns.value.join('|')}:${rows.value.length}`,
)

const columnDefs = computed<ColDef[]>(() => {
  const lockFirst = lockFirstColumn.value
  return columns.value.map((field, index) => {
    const kind = inferSheetColumnKind(field, rows.value)
    const base: ColDef = {
      colId: `c_${index}`,
      headerName: field.trim() === '' ? `열 ${index + 1}` : field,
      context: { sourceKey: field } as { sourceKey: string },
      valueGetter: (p) => (p.data != null ? p.data[field] : undefined),
      valueSetter: (p) => {
        if (!p.data) return false
        p.data[field] = p.newValue as SheetRow[string]
        return true
      },
      editable: () => {
        if (lockFirst && index === 0) return false
        return true
      },
      sortable: true,
      resizable: true,
      flex: 1,
      minWidth: 104,
    }
    if (kind === 'number') {
      base.cellEditor = 'agNumberCellEditor'
      base.filter = 'agNumberColumnFilter'
      base.valueParser = (p) => {
        if (p.newValue === '' || p.newValue === null || p.newValue === undefined) return null
        if (typeof p.newValue === 'number' && Number.isFinite(p.newValue)) return p.newValue
        const n = Number(String(p.newValue).replace(/,/g, ''))
        return Number.isFinite(n) ? n : null
      }
    } else if (kind === 'date') {
      base.cellEditor = 'agDateStringCellEditor'
      base.filter = 'agDateColumnFilter'
    } else {
      base.filter = 'agTextColumnFilter'
    }
    return base
  })
})

const defaultColDef: ColDef = {
  editable: true,
  sortable: true,
  filter: true,
  resizable: true,
}

const onGridReady = (e: GridReadyEvent<SheetRow>) => {
  gridApi.value = e.api
  bumpToolbar()
}

const getRowId = (p: GetRowIdParams<SheetRow>) =>
  String(p.data?.[SHEET_ROW_ID_KEY] ?? '')

/** 편집 값을 Pinia에 반영해 JSON 미리보기·보내기가 즉시 따라가게 함 */
const onCellValueChanged = (e: CellValueChangedEvent) => {
  const data = e.data as SheetRow | undefined
  if (!data) return
  const idx = rows.value.findIndex((r) => r === data)
  if (idx < 0) return
  const next: SheetRow = { ...data }
  const copy = rows.value.slice()
  copy[idx] = next
  rows.value = copy
  bumpToolbar()
}

const onSelectionChanged = () => {
  bumpToolbar()
}

const canUndo = computed(() => {
  toolbarTick.value
  return (gridApi.value?.getCurrentUndoSize?.() ?? 0) > 0
})

const canRedo = computed(() => {
  toolbarTick.value
  return (gridApi.value?.getCurrentRedoSize?.() ?? 0) > 0
})

const selectedCount = computed(() => {
  toolbarTick.value
  return gridApi.value?.getSelectedRows().length ?? 0
})

const undoEdit = () => {
  gridApi.value?.undoCellEditing()
  bumpToolbar()
}

const redoEdit = () => {
  gridApi.value?.redoCellEditing()
  bumpToolbar()
}

const handleAddRow = () => {
  addEmptyRow()
  bumpToolbar()
}

const handleRemoveSelected = () => {
  const api = gridApi.value
  if (!api) return
  const selected = api.getSelectedRows() as SheetRow[]
  if (selected.length === 0) return
  removeRows(selected)
  api.deselectAll()
  bumpToolbar()
}

const jsonPreview = computed(() => {
  const max = 400
  const stripped = rows.value.map(stripSheetRowMeta)
  const slice = stripped.slice(0, max)
  const header =
    rows.value.length > max
      ? `/* 처음 ${max}행만 미리보기 · 전체 ${rows.value.length}행 */\n`
      : ''
  try {
    return header + JSON.stringify(slice, null, 2)
  } catch {
    return 'JSON 변환 실패'
  }
})

const hasData = computed(() => rows.value.length > 0 && columns.value.length > 0)

/** 샘플/일반 엑셀에서 month·branch 가 있으면 필수로 검증 */
const validationRequiredKeys = computed(() => {
  const s = new Set(columns.value)
  return (['month', 'branch'] as const).filter((k) => s.has(k)).map(String)
})

const validationResult = computed(() =>
  validateSheetData({
    columns: columns.value,
    rows: rows.value.map(stripSheetRowMeta),
    requiredKeys: validationRequiredKeys.value,
  }),
)

const triggerFilePick = () => fileInputRef.value?.click()

const onFileInputChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  await loadExcelFile(file)
}

const onDropFiles = async (event: DragEvent) => {
  isDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  const ok =
    file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
  if (!ok) {
    sheet.$patch({
      loadStatus: 'error',
      loadError: '엑셀 파일(.xlsx, .xls)만 놓을 수 있습니다.',
    })
    return
  }
  await loadExcelFile(file)
}

const handleExport = async () => {
  if (rows.value.length === 0) return
  const base =
    fileName.value?.replace(/\.(xlsx|xls)$/i, '') ?? 'export'
  await exportRowsToXlsxFile(
    rows.value.map(stripSheetRowMeta),
    `${base}-export.xlsx`,
  )
}

const onSelectSheet = (name: string) => {
  void selectSheet(name)
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 px-4 py-8">
    <header class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        {{ appTitle }}
      </h1>
      <p class="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
        엑셀을 불러오면 그리드·JSON·차트가 같은 Pinia 데이터를 봅니다. 검증 패널·셀 편집·행 추가/삭제·실행 취소(Ctrl+Z)를 지원합니다.
      </p>
    </header>

    <DashboardDataLoader
      :is-drag-over="isDragOver"
      :data-source="dataSource"
      :file-name="fileName"
      :sheet-names="sheetNames"
      :active-sheet-name="activeSheetName"
      :export-disabled="rows.length === 0"
      @update:is-drag-over="isDragOver = $event"
      @pick-file="triggerFilePick"
      @load-sample="loadSample"
      @export="handleExport"
      @drop-files="onDropFiles"
      @select-sheet="onSelectSheet"
    />
    <input
      ref="fileInputRef"
      class="sr-only"
      type="file"
      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
      aria-label="엑셀 파일 선택"
      @change="onFileInputChange"
    />

    <SheetValidationPanel v-if="hasData" :issues="validationResult.issues" />

    <DashboardStatusBanner
      :load-status="loadStatus"
      :load-error="loadError"
      @close-error="clearError"
    />

    <DashboardPreviewHeader
      :has-data="hasData"
      :rows-count="rows.length"
      :columns-count="columns.length"
      :active-sheet-name="activeSheetName"
      :preview-tab="previewTab"
      @update:preview-tab="previewTab = $event"
    />

    <div v-if="hasData" class="grid gap-4 lg:grid-cols-3 lg:items-start">
      <div class="min-w-0 space-y-4 lg:col-span-2">
        <DashboardGridPanel
          v-show="previewTab === 'grid'"
          :has-data="hasData"
          :grid-key="gridKey"
          :rows="rows"
          :column-defs="columnDefs"
          :default-col-def="defaultColDef"
          :row-selection="rowSelection"
          :get-row-id="getRowId"
          :selected-count="selectedCount"
          :can-undo="canUndo"
          :can-redo="canRedo"
          :lock-first-column="lockFirstColumn"
          @update:lock-first-column="lockFirstColumn = $event"
          @add-row="handleAddRow"
          @remove-selected="handleRemoveSelected"
          @undo="undoEdit"
          @redo="redoEdit"
          @grid-ready="onGridReady"
          @cell-value-changed="onCellValueChanged"
          @selection-changed="onSelectionChanged"
        />

        <DashboardJsonPreview
          v-show="previewTab === 'json' && hasData"
          :json-preview="jsonPreview"
        />
      </div>
      <SheetBarChart
        class="lg:col-span-1"
        :rows="rows"
        :columns="columns"
        :label-column-key="chartLabelColumn"
        :value-column-key="chartValueColumn"
      />
    </div>
  </div>
</template>
