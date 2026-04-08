import { describe, expect, it } from 'vitest'
import type { SheetRow } from '@/types/sheet'
import { resolveBarChartAxes } from '@/composables/useBarChartAxes'

describe('resolveBarChartAxes', () => {
  it('숫자 열이 없으면 null', () => {
    const rows: SheetRow[] = [{ a: 'x', b: 'y' }]
    const r = resolveBarChartAxes(['a', 'b'], rows, null, null)
    expect(r).toBeNull()
  })

  it('자동으로 라벨·값 열을 고른다', () => {
    const rows: SheetRow[] = [
      { branch: '서울', sales: 10 },
      { branch: '부산', sales: 20 },
    ]
    const r = resolveBarChartAxes(['branch', 'sales'], rows, null, null)
    expect(r).toEqual({ labelKey: 'branch', valueKey: 'sales' })
  })

  it('저장된 열 이름이 있으면 우선한다', () => {
    const rows: SheetRow[] = [
      { branch: '서울', sales: 10, extra: 1 },
      { branch: '부산', sales: 20, extra: 2 },
    ]
    const r = resolveBarChartAxes(['branch', 'sales', 'extra'], rows, 'branch', 'extra')
    expect(r).toEqual({ labelKey: 'branch', valueKey: 'extra' })
  })
})
