import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SheetRow } from '@/types/sheet'
import { SHEET_ROW_ID_KEY } from '@/types/sheet'
import { createSampleData } from '@/composables/useSheetJs'
import { getWorkbookSheetNames, parseSheetFromBuffer } from '@/lib/sheetXlsx'

export type SheetLoadStatus = 'idle' | 'loading' | 'ready' | 'error'
export type SheetDataSource = 'none' | 'sample' | 'file'

export const useSheetStore = defineStore('sheet', () => {
  const rows = ref<SheetRow[]>([])
  const columns = ref<string[]>([])

  const dataSource = ref<SheetDataSource>('none')
  const loadStatus = ref<SheetLoadStatus>('idle')
  const loadError = ref<string | null>(null)

  const fileName = ref<string | null>(null)
  const fileBuffer = ref<ArrayBuffer | null>(null)
  const sheetNames = ref<string[]>([])
  const activeSheetName = ref<string | null>(null)

  let rowIdSeq = 0
  const nextRowId = () => {
    rowIdSeq += 1
    return `sr-${rowIdSeq}`
  }

  const setSheetData = (nextRows: SheetRow[], nextColumns: string[]) => {
    columns.value = nextColumns
    rows.value = nextRows.map((r) => {
      const base = { ...r }
      delete base[SHEET_ROW_ID_KEY]
      return { ...base, [SHEET_ROW_ID_KEY]: nextRowId() }
    })
  }

  const clearError = () => {
    loadError.value = null
  }

  const loadSample = () => {
    clearError()
    loadStatus.value = 'ready'
    dataSource.value = 'sample'
    fileName.value = null
    fileBuffer.value = null
    sheetNames.value = []
    activeSheetName.value = null
    const sample = createSampleData()
    setSheetData(sample.rows, sample.columns)
  }

  const applySheetFromBuffer = async (name: string) => {
    const buf = fileBuffer.value
    if (!buf) return
    const parsed = await parseSheetFromBuffer(buf, name)
    activeSheetName.value = name
    setSheetData(parsed.rows, parsed.columns)
    if (parsed.rows.length === 0 && parsed.columns.length === 0) {
      loadError.value = '이 시트에 표시할 데이터가 없습니다. (빈 시트 또는 헤더만 있음)'
    }
  }

  const loadExcelFile = async (file: File) => {
    clearError()
    loadStatus.value = 'loading'
    dataSource.value = 'none'
    try {
      const buffer = await file.arrayBuffer()
      const names = await getWorkbookSheetNames(buffer)
      if (names.length === 0) {
        throw new Error('통합문서에 시트가 없습니다.')
      }
      fileBuffer.value = buffer
      fileName.value = file.name
      sheetNames.value = names
      const first = names[0]
      if (!first) throw new Error('시트 이름을 읽을 수 없습니다.')
      await applySheetFromBuffer(first)
      dataSource.value = 'file'
      loadStatus.value = 'ready'
    } catch (e) {
      fileBuffer.value = null
      fileName.value = null
      sheetNames.value = []
      activeSheetName.value = null
      rows.value = []
      columns.value = []
      loadStatus.value = 'error'
      loadError.value = e instanceof Error ? e.message : '파일을 읽는 중 오류가 났습니다.'
    }
  }

  const selectSheet = async (name: string) => {
    if (!fileBuffer.value || dataSource.value !== 'file') return
    clearError()
    await applySheetFromBuffer(name)
  }

  const addEmptyRow = () => {
    if (columns.value.length === 0) return
    const row = columns.value.reduce<SheetRow>((acc, key) => {
      acc[key] = null
      return acc
    }, {})
    row[SHEET_ROW_ID_KEY] = nextRowId()
    rows.value = [...rows.value, row]
  }

  const removeRows = (toRemove: SheetRow[]) => {
    if (toRemove.length === 0) return
    const drop = new Set(toRemove)
    rows.value = rows.value.filter((r) => !drop.has(r))
  }

  return {
    rows,
    columns,
    dataSource,
    loadStatus,
    loadError,
    fileName,
    sheetNames,
    activeSheetName,
    setSheetData,
    clearError,
    loadSample,
    loadExcelFile,
    selectSheet,
    addEmptyRow,
    removeRows,
  }
})
