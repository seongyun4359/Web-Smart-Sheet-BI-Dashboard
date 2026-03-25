import type { ValidationIssue, ValidationResult, ValidateSheetOptions } from '@/types/validation'
import { inferSheetColumnKind, type SheetColumnKind } from '@/composables/useSheetColumnKind'

function isEmptyCell(v: unknown): boolean {
  return v === null || v === undefined || v === ''
}

function parseAsNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v !== 'string') return null
  const t = v.trim().replace(/,/g, '')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

function parseAsDate(v: unknown): boolean {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return true
  if (typeof v !== 'string') return false
  const t = v.trim()
  if (t.length < 6) return false
  return !Number.isNaN(Date.parse(t))
}

function validateCell(kind: SheetColumnKind, value: unknown): boolean {
  if (isEmptyCell(value)) return true
  if (kind === 'number') return parseAsNumber(value) !== null
  if (kind === 'date') return parseAsDate(value)
  return true
}

/**
 * 시트 데이터 구조·필수값·추정 타입(숫자/날짜) 일관성 검증
 */
export function validateSheetData(options: ValidateSheetOptions): ValidationResult {
  const { columns, rows, requiredKeys = [] } = options
  const issues: ValidationIssue[] = []

  if (columns.length === 0) {
    if (rows.length > 0) {
      issues.push({
        severity: 'error',
        code: 'NO_COLUMNS',
        message: '컬럼(헤더)이 없는데 데이터 행이 있습니다.',
      })
    }
    return { ok: issues.length === 0, issues }
  }

  const kinds = new Map<string, SheetColumnKind>()
  for (const col of columns) {
    kinds.set(col, inferSheetColumnKind(col, rows))
  }

  for (const key of requiredKeys) {
    if (!columns.includes(key)) {
      issues.push({
        severity: 'error',
        code: 'MISSING_REQUIRED_COLUMN',
        message: `필수 컬럼 「${key}」이(가) 시트에 없습니다.`,
        field: key,
      })
    }
  }

  rows.forEach((row, rowIndex) => {
    for (const key of requiredKeys) {
      if (!columns.includes(key)) continue
      if (isEmptyCell(row[key])) {
        issues.push({
          severity: 'error',
          code: 'REQUIRED_EMPTY',
          message: `필수 값 누락: 「${key}」`,
          rowIndex,
          field: key,
        })
      }
    }

    for (const col of columns) {
      const kind = kinds.get(col) ?? 'text'
      const value = row[col]
      if (!validateCell(kind, value)) {
        issues.push({
          severity: 'warning',
          code: kind === 'number' ? 'TYPE_NUMBER' : 'TYPE_DATE',
          message:
            kind === 'number'
              ? `숫자로 해석할 수 없는 값: 「${col}」 = ${String(value)}`
              : `날짜로 해석하기 어려운 값: 「${col}」 = ${String(value)}`,
          rowIndex,
          field: col,
        })
      }
    }
  })

  const hasError = issues.some((i) => i.severity === 'error')
  return { ok: !hasError, issues }
}
