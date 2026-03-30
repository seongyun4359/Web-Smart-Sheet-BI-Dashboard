<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ensureAgGridRegistered } from '@/lib/ensureAgGridRegistered'
import { exportRowsToXlsxFile } from '@/lib/sheetXlsx'
import SheetBarChart from '@/components/SheetBarChart.vue'
import SheetValidationPanel from '@/components/SheetValidationPanel.vue'
import { validateSheetData } from '@/composables/useSheetValidation'
import { AgGridVue } from 'ag-grid-vue3'
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

ensureAgGridRegistered()

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
const { appTitle, lockFirstColumnByDefault } = storeToRefs(settings)

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

    <!-- 도구 모음 -->
    <section
      class="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/50"
      aria-label="데이터 불러오기"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div
          class="flex min-h-[140px] flex-1 flex-col justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors"
          :class="
            isDragOver
              ? 'border-violet-500 bg-violet-50/80 dark:border-violet-400 dark:bg-violet-950/30'
              : 'border-slate-300 bg-slate-50/50 dark:border-slate-600 dark:bg-slate-800/30'
          "
          role="button"
          tabindex="0"
          @dragenter.prevent="isDragOver = true"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="onDropFiles"
          @keydown.enter.prevent="triggerFilePick"
          @keydown.space.prevent="triggerFilePick"
        >
          <p class="text-sm font-medium text-slate-800 dark:text-slate-200">
            엑셀 파일을 여기에 놓거나
          </p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">.xlsx · .xls</p>
          <button
            type="button"
            class="mx-auto mt-4 inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            @click="triggerFilePick"
          >
            파일 선택
          </button>
          <input
            ref="fileInputRef"
            class="sr-only"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            aria-label="엑셀 파일 선택"
            @change="onFileInputChange"
          />
        </div>

        <div class="flex flex-col justify-center gap-2 lg:w-56">
          <button
            type="button"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            @click="loadSample"
          >
            샘플 데이터
          </button>
          <button
            type="button"
            class="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-medium text-violet-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-200"
            :disabled="rows.length === 0"
            @click="handleExport"
          >
            엑셀로보내기
          </button>
        </div>
      </div>

      <!-- 현재 파일 / 시트 -->
      <div
        v-if="dataSource === 'file' && fileName"
        class="mt-4 flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-700"
      >
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span class="text-slate-500 dark:text-slate-400">불러온 파일</span>
          <span
            class="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200"
            :title="fileName"
          >
            {{ fileName }}
          </span>
        </div>
        <div v-if="sheetNames.length > 1" class="flex flex-wrap gap-2" role="tablist" aria-label="시트 선택">
          <button
            v-for="name in sheetNames"
            :key="name"
            type="button"
            role="tab"
            :aria-selected="name === activeSheetName"
            class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            :class="
              name === activeSheetName
                ? 'border-violet-500 bg-violet-50 text-violet-800 dark:border-violet-400 dark:bg-violet-950/40 dark:text-violet-200'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
            "
            @click="onSelectSheet(name)"
          >
            {{ name }}
          </button>
        </div>
      </div>
    </section>

    <SheetValidationPanel v-if="hasData" :issues="validationResult.issues" />

    <!-- 로딩 / 에러 -->
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
        @click="clearError"
      >
        메시지 닫기
      </button>
    </div>

    <!-- 요약 + 미리보기 탭 -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-slate-600 dark:text-slate-400">
        <template v-if="hasData">
          <strong class="font-semibold text-slate-900 dark:text-slate-100">{{ rows.length }}</strong>
          행 ·
          <strong class="font-semibold text-slate-900 dark:text-slate-100">{{ columns.length }}</strong>
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
          @click="previewTab = 'grid'"
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
          @click="previewTab = 'json'"
        >
          JSON 미리보기
        </button>
      </div>
    </div>

    <div v-if="hasData" class="grid gap-4 lg:grid-cols-3 lg:items-start">
      <div class="min-w-0 space-y-4 lg:col-span-2">
    <!-- 그리드 -->
    <div
      v-show="previewTab === 'grid'"
      class="ag-theme-quartz min-h-[420px] overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-700 lg:min-h-[560px]"
    >
      <template v-if="hasData">
        <div
          class="flex flex-col gap-2 border-b border-slate-200 bg-slate-50/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
        >
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              @click="handleAddRow"
            >
              행 추가
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              :disabled="selectedCount === 0"
              @click="handleRemoveSelected"
            >
              선택 행 삭제
              <span v-if="selectedCount > 0" class="ml-1 text-violet-600 dark:text-violet-400"
                >({{ selectedCount }})</span
              >
            </button>
            <span class="hidden h-4 w-px bg-slate-300 sm:inline dark:bg-slate-600" aria-hidden="true" />
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              :disabled="!canUndo"
              title="셀 편집 실행 취소 (Ctrl+Z)"
              @click="undoEdit"
            >
              실행 취소
            </button>
            <button
              type="button"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              :disabled="!canRedo"
              title="다시 실행 (Ctrl+Y)"
              @click="redoEdit"
            >
              다시 실행
            </button>
          </div>
          <label
            class="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
          >
            <input
              v-model="lockFirstColumn"
              type="checkbox"
              class="size-3.5 rounded border-slate-400 text-violet-600 focus:ring-violet-500"
            />
            첫 데이터 열 잠금 (키·코드 열용)
          </label>
        </div>
        <AgGridVue
          :key="gridKey"
          class="h-[380px] w-full lg:h-[520px]"
          :row-data="rows"
          :column-defs="columnDefs"
          :default-col-def="defaultColDef"
          :row-selection="rowSelection"
          :get-row-id="getRowId"
          :animate-rows="true"
          :single-click-edit="true"
          :stop-editing-when-cells-lose-focus="true"
          :undo-redo-cell-editing="true"
          :undo-redo-cell-editing-limit="30"
          @grid-ready="onGridReady"
          @cell-value-changed="onCellValueChanged"
          @selection-changed="onSelectionChanged"
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

    <!-- JSON -->
    <div
      v-show="previewTab === 'json' && hasData"
      class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-700"
    >
      <pre
        class="max-h-[560px] overflow-auto p-4 text-left text-xs leading-relaxed text-emerald-100/90"
        >{{ jsonPreview }}</pre
      >
    </div>
      </div>
      <SheetBarChart class="lg:col-span-1" :rows="rows" :columns="columns" />
    </div>
  </div>
</template>
