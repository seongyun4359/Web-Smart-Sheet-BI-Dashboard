import type { SheetRow } from '@/types/sheet'

export type SheetColumnKind = 'text' | 'number' | 'date'

const HEADER_HINT_DATE = /date|날짜|일자|시간|datetime|month|월|year|년/i
const HEADER_HINT_NUMBER = /amount|금액|가격|수량|qty|sales|cost|price|total|합계|매출|원가|개수|건수|rate|비율|#/i

function looksLikeNumber(v: unknown): boolean {
  if (typeof v === 'number' && Number.isFinite(v)) return true
  if (typeof v !== 'string') return false
  const t = v.trim().replace(/,/g, '')
  if (t === '') return false
  return Number.isFinite(Number(t))
}

function looksLikeDateString(v: unknown): boolean {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return true
  if (typeof v !== 'string') return false
  const t = v.trim()
  if (t.length < 6) return false
  const parsed = Date.parse(t)
  if (Number.isNaN(parsed)) return false
  return /\d{4}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}|년|월|일|T\d{2}:/.test(t)
}

/** 샘플 값·헤더 이름으로 편집기 종류 추정 */
export function inferSheetColumnKind(field: string, sampleRows: SheetRow[]): SheetColumnKind {
  if (HEADER_HINT_DATE.test(field)) return 'date'
  if (HEADER_HINT_NUMBER.test(field)) return 'number'

  let checked = 0
  let num = 0
  let date = 0
  const limit = 80
  for (const row of sampleRows) {
    if (checked >= limit) break
    const v = row[field]
    if (v === null || v === undefined || v === '') continue
    checked++
    if (looksLikeDateString(v)) date++
    if (looksLikeNumber(v)) num++
  }
  if (checked === 0) return 'text'
  if (date / checked >= 0.55) return 'date'
  if (num / checked >= 0.65) return 'number'
  return 'text'
}
