/** 그리드 행 안정 ID(엑셀·보내기에는 포함하지 않음) */
export const SHEET_ROW_ID_KEY = '__sheetRowId' as const

export type SheetRow = Record<string, string | number | boolean | null>

export interface SheetData {
  rows: SheetRow[]
  columns: string[]
}

export function stripSheetRowMeta(row: SheetRow): SheetRow {
  const copy = { ...row }
  delete copy[SHEET_ROW_ID_KEY]
  return copy
}
