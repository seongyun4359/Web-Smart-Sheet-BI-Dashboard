import { describe, expect, it } from 'vitest'
import { validateSheetData } from '@/composables/useSheetValidation'
import type { SheetRow } from '@/types/sheet'

describe('validateSheetData', () => {
  it('필수 컬럼이 없으면 오류', () => {
    const r = validateSheetData({
      columns: ['a'],
      rows: [{ a: 1 }],
      requiredKeys: ['missing'],
    })
    expect(r.ok).toBe(false)
    expect(r.issues.some((i) => i.code === 'MISSING_REQUIRED_COLUMN')).toBe(true)
  })

  it('필수 값이 비어 있으면 오류', () => {
    const rows: SheetRow[] = [{ month: '', branch: '서울' }]
    const r = validateSheetData({
      columns: ['month', 'branch'],
      rows,
      requiredKeys: ['month'],
    })
    expect(r.ok).toBe(false)
    expect(r.issues.some((i) => i.code === 'REQUIRED_EMPTY')).toBe(true)
  })

  it('숫자 열에 문자열이 있으면 경고', () => {
    const rows: SheetRow[] = [{ sales: 'not-a-number' }]
    const r = validateSheetData({
      columns: ['sales'],
      rows,
      requiredKeys: [],
    })
    expect(r.issues.some((i) => i.code === 'TYPE_NUMBER')).toBe(true)
  })

  it('정상 샘플이면 오류 없음', () => {
    const rows: SheetRow[] = [
      { month: '2026-01', branch: '서울', sales: 100 },
      { month: '2026-02', branch: '부산', sales: 200 },
    ]
    const r = validateSheetData({
      columns: ['month', 'branch', 'sales'],
      rows,
      requiredKeys: ['month', 'branch'],
    })
    expect(r.ok).toBe(true)
    expect(r.issues.filter((i) => i.severity === 'error')).toHaveLength(0)
  })
})
