import type { SheetRow } from '@/types/sheet'

export type ValidationSeverity = 'error' | 'warning'

export interface ValidationIssue {
  severity: ValidationSeverity
  code: string
  message: string
  /** 0-based 데이터 행 인덱스 (헤더 제외) */
  rowIndex?: number
  field?: string
}

export interface ValidationResult {
  ok: boolean
  issues: ValidationIssue[]
}

export interface ValidateSheetOptions {
  columns: string[]
  rows: SheetRow[]
  /** 비어 있으면 안 되는 컬럼 키 */
  requiredKeys?: string[]
}
