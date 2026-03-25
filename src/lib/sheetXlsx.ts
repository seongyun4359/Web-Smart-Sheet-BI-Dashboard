import type { WorkSheet } from 'xlsx'
import type { SheetData, SheetRow } from '@/types/sheet'

async function loadXlsx() {
  return import('xlsx')
}

export async function getWorkbookSheetNames(buffer: ArrayBuffer): Promise<string[]> {
  const XLSX = await loadXlsx()
  const workbook = XLSX.read(buffer, { type: 'array' })
  return workbook.SheetNames ?? []
}

function sheetToData(
  XLSX: Awaited<ReturnType<typeof loadXlsx>>,
  worksheet: WorkSheet | undefined,
): SheetData {
  if (!worksheet) {
    return { rows: [], columns: [] }
  }
  const rows = XLSX.utils.sheet_to_json<SheetRow>(worksheet, {
    defval: null,
    raw: false,
    blankrows: false,
  })
  const columns = rows.length > 0 ? Object.keys(rows[0]) : []
  return { rows, columns }
}

export async function parseSheetFromBuffer(
  buffer: ArrayBuffer,
  sheetName: string,
): Promise<SheetData> {
  const XLSX = await loadXlsx()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const ws = workbook.Sheets[sheetName]
  return sheetToData(XLSX, ws)
}

export async function exportRowsToXlsxFile(
  rows: SheetRow[],
  fileName = 'sheet-export.xlsx',
): Promise<void> {
  const XLSX = await loadXlsx()
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  XLSX.writeFile(workbook, fileName)
}
