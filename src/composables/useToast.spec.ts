import { afterEach, describe, expect, it, vi } from 'vitest'
import { useToast } from '@/composables/useToast'

describe('useToast', () => {
  afterEach(() => {
    vi.useRealTimers()
    const { clearToasts } = useToast()
    clearToasts()
  })

  it('토스트를 추가하고 시간이 지나면 제거한다', () => {
    vi.useFakeTimers()
    const { toasts, showToast } = useToast()

    showToast('설정이 저장되었습니다.', { durationMs: 500 })
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(500)
    expect(toasts.value).toHaveLength(0)
  })
})
