import type { SheetRow } from '@/types/sheet'
import { inferSheetColumnKind } from '@/composables/useSheetColumnKind'

export type BarChartAxes = {
  labelKey: string
  valueKey: string
} | null

/**
 * 막대 차트용 라벨/값 열을 결정한다.
 * override 가 있고 현재 컬럼 목록에 있으면 우선한다. 없으면 자동 추론.
 */
export function resolveBarChartAxes(
  columns: string[],
  rows: SheetRow[],
  labelColumn: string | null,
  valueColumn: string | null,
): BarChartAxes {
  if (columns.length === 0 || rows.length === 0) return null

  const autoLabel =
    columns.find((c) => inferSheetColumnKind(c, rows) !== 'number') ?? columns[0]
  const autoValue = columns.find((c) => inferSheetColumnKind(c, rows) === 'number')

  const labelKey =
    labelColumn && columns.includes(labelColumn) ? labelColumn : autoLabel
  const valueKey =
    valueColumn && columns.includes(valueColumn)
      ? valueColumn
      : autoValue ?? null

  if (!valueKey) return null

  let resolvedLabel = labelKey
  if (resolvedLabel === valueKey) {
    const alt = columns.find((c) => c !== valueKey)
    resolvedLabel = alt ?? resolvedLabel
  }
  return { labelKey: resolvedLabel, valueKey }
}
