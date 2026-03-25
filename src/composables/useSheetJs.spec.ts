import { describe, expect, it } from 'vitest'
import { createSampleData } from '@/composables/useSheetJs'

describe('createSampleData', () => {
  it('컬럼과 행을 반환한다', () => {
    const d = createSampleData()
    expect(d.columns.length).toBeGreaterThan(0)
    expect(d.rows.length).toBeGreaterThan(0)
    expect(d.rows[0]).toHaveProperty('month')
  })
})
