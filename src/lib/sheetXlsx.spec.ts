import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { getWorkbookSheetNames, parseSheetFromBuffer } from '@/lib/sheetXlsx'

function workbookToArrayBuffer(wb: XLSX.WorkBook): ArrayBuffer {
  const bin = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' }) as string
  const len = bin.length
  const u8 = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    u8[i] = bin.charCodeAt(i) & 0xff
  }
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)
}

describe('sheetXlsx (동적 xlsx)', () => {
  it('시트 이름을 읽는다', async () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ['name', 'qty'],
      ['a', 1],
    ])
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    const buf = workbookToArrayBuffer(wb)
    const names = await getWorkbookSheetNames(buf)
    expect(names).toContain('Data')
  })

  it('시트를 JSON 형태로 파싱한다', async () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([
      ['month', 'sales'],
      ['2026-01', 10],
      ['2026-02', 20],
    ])
    XLSX.utils.book_append_sheet(wb, ws, 'S1')
    const buf = workbookToArrayBuffer(wb)
    const data = await parseSheetFromBuffer(buf, 'S1')
    expect(data.columns).toEqual(['month', 'sales'])
    expect(data.rows).toHaveLength(2)
    expect(data.rows[0]?.month).toBe('2026-01')
  })
})
