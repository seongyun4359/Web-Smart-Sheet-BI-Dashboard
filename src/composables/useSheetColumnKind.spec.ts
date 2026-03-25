import { describe, expect, it } from 'vitest'
import { inferSheetColumnKind } from '@/composables/useSheetColumnKind'
import type { SheetRow } from '@/types/sheet'

describe('inferSheetColumnKind', () => {
  it('헤더 힌트로 숫자 열을 추정한다', () => {
    const rows: SheetRow[] = [{ sales: 'x' }]
    expect(inferSheetColumnKind('sales', rows)).toBe('number')
  })

  it('값이 모두 숫자면 number', () => {
    const rows: SheetRow[] = [{ col: 1 }, { col: 2 }, { col: 3 }]
    expect(inferSheetColumnKind('col', rows)).toBe('number')
  })

  it('날짜 형태 문자열이 많으면 date', () => {
    const rows: SheetRow[] = [
      { d: '2026-01-01' },
      { d: '2026-02-01' },
      { d: '2026-03-01' },
    ]
    expect(inferSheetColumnKind('d', rows)).toBe('date')
  })

  it('혼합 적으면 text', () => {
    const rows: SheetRow[] = [{ note: 'hello' }, { note: 'world' }]
    expect(inferSheetColumnKind('note', rows)).toBe('text')
  })
})
