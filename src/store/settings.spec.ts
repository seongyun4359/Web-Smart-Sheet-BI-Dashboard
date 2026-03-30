import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  useSettingsStore,
} from '@/store/settings'

describe('useSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    window.localStorage.clear()
  })

  it('저장된 UI 설정을 hydrate 한다', () => {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({
        appTitle: '맞춤 대시보드',
        themeMode: 'dark',
        lockFirstColumnByDefault: true,
      }),
    )

    const store = useSettingsStore()
    store.hydrate()

    expect(store.appTitle).toBe('맞춤 대시보드')
    expect(store.themeMode).toBe('dark')
    expect(store.lockFirstColumnByDefault).toBe(true)
  })

  it('applySettings 호출 시 localStorage에 저장한다', () => {
    const store = useSettingsStore()
    store.hydrate()

    store.applySettings({
      appTitle: '영업 BI 보드',
      themeMode: 'light',
      lockFirstColumnByDefault: true,
    })

    expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toEqual({
      appTitle: '영업 BI 보드',
      themeMode: 'light',
      lockFirstColumnByDefault: true,
    })
  })

  it('필드 직접 변경만으로는 localStorage에 저장하지 않는다', () => {
    const store = useSettingsStore()
    store.hydrate()

    store.appTitle = '임시 제목'
    store.themeMode = 'dark'
    store.lockFirstColumnByDefault = true

    expect(window.localStorage.getItem(SETTINGS_STORAGE_KEY)).toBeNull()
  })

  it('기본값 복원 시 저장값도 함께 초기화한다', () => {
    const store = useSettingsStore()
    store.hydrate()

    store.applySettings({
      appTitle: '임시 제목',
      themeMode: 'dark',
      lockFirstColumnByDefault: true,
    })

    store.resetToDefaults()

    expect(store.appTitle).toBe(DEFAULT_SETTINGS.appTitle)
    expect(store.themeMode).toBe(DEFAULT_SETTINGS.themeMode)
    expect(store.lockFirstColumnByDefault).toBe(DEFAULT_SETTINGS.lockFirstColumnByDefault)
    expect(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? '{}')).toEqual(
      DEFAULT_SETTINGS,
    )
  })
})
