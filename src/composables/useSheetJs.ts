import type { SheetData, SheetRow } from '@/types/sheet'

const SAMPLE_ROWS: SheetRow[] = [
  { month: '2026-01', branch: '서울', sales: 1200000, cost: 800000 },
  { month: '2026-01', branch: '부산', sales: 950000, cost: 610000 },
  { month: '2026-02', branch: '서울', sales: 1310000, cost: 840000 },
]

/** 엑셀 파싱·저장은 `@/lib/sheetXlsx` 동적 로딩 사용 */
export function createSampleData(): SheetData {
  return {
    rows: SAMPLE_ROWS,
    columns: Object.keys(SAMPLE_ROWS[0] ?? {}),
  }
}

export function useSheetJs() {
  return { createSampleData }
}
