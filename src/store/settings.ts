import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'

export type SettingsState = {
  appTitle: string
  themeMode: ThemeMode
  lockFirstColumnByDefault: boolean
  /** 막대 차트 가로축(라벨) 열 이름. null 이면 데이터에서 자동 추론 */
  chartLabelColumn: string | null
  /** 막대 차트 세로축(값) 열 이름. null 이면 숫자 열 자동 추론 */
  chartValueColumn: string | null
}

export const SETTINGS_STORAGE_KEY = 'smart-sheet-ui-settings:v1'

export const DEFAULT_SETTINGS: SettingsState = {
  appTitle: 'Smart-Sheet BI Dashboard',
  themeMode: 'system',
  lockFirstColumnByDefault: false,
  chartLabelColumn: null,
  chartValueColumn: null,
}

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === 'system' || value === 'light' || value === 'dark'

const sanitizeSettings = (value: unknown): SettingsState => {
  if (!value || typeof value !== 'object') return { ...DEFAULT_SETTINGS }
  const raw = value as Partial<SettingsState>
  return {
    appTitle:
      typeof raw.appTitle === 'string' && raw.appTitle.trim() !== ''
        ? raw.appTitle.trim()
        : DEFAULT_SETTINGS.appTitle,
    themeMode: isThemeMode(raw.themeMode) ? raw.themeMode : DEFAULT_SETTINGS.themeMode,
    lockFirstColumnByDefault:
      typeof raw.lockFirstColumnByDefault === 'boolean'
        ? raw.lockFirstColumnByDefault
        : DEFAULT_SETTINGS.lockFirstColumnByDefault,
    chartLabelColumn:
      raw.chartLabelColumn === null || raw.chartLabelColumn === undefined
        ? DEFAULT_SETTINGS.chartLabelColumn
        : typeof raw.chartLabelColumn === 'string' && raw.chartLabelColumn.trim() !== ''
          ? raw.chartLabelColumn.trim()
          : null,
    chartValueColumn:
      raw.chartValueColumn === null || raw.chartValueColumn === undefined
        ? DEFAULT_SETTINGS.chartValueColumn
        : typeof raw.chartValueColumn === 'string' && raw.chartValueColumn.trim() !== ''
          ? raw.chartValueColumn.trim()
          : null,
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const appTitle = ref(DEFAULT_SETTINGS.appTitle)
  const themeMode = ref<ThemeMode>(DEFAULT_SETTINGS.themeMode)
  const lockFirstColumnByDefault = ref(DEFAULT_SETTINGS.lockFirstColumnByDefault)
  const chartLabelColumn = ref<string | null>(DEFAULT_SETTINGS.chartLabelColumn)
  const chartValueColumn = ref<string | null>(DEFAULT_SETTINGS.chartValueColumn)
  const hydrated = ref(false)

  const snapshot = computed<SettingsState>(() => ({
    appTitle: appTitle.value.trim() || DEFAULT_SETTINGS.appTitle,
    themeMode: themeMode.value,
    lockFirstColumnByDefault: lockFirstColumnByDefault.value,
    chartLabelColumn: chartLabelColumn.value,
    chartValueColumn: chartValueColumn.value,
  }))

  const hydrate = () => {
    if (hydrated.value || typeof window === 'undefined') {
      hydrated.value = true
      return
    }
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        const next = sanitizeSettings(parsed)
        appTitle.value = next.appTitle
        themeMode.value = next.themeMode
        lockFirstColumnByDefault.value = next.lockFirstColumnByDefault
        chartLabelColumn.value = next.chartLabelColumn
        chartValueColumn.value = next.chartValueColumn
      }
    } catch {
      window.localStorage.removeItem(SETTINGS_STORAGE_KEY)
    } finally {
      hydrated.value = true
    }
  }

  const writeSnapshot = (value: SettingsState) => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(value))
  }

  const applySettings = (value: Partial<SettingsState>) => {
    const next = sanitizeSettings({ ...snapshot.value, ...value })
    appTitle.value = next.appTitle
    themeMode.value = next.themeMode
    lockFirstColumnByDefault.value = next.lockFirstColumnByDefault
    chartLabelColumn.value = next.chartLabelColumn
    chartValueColumn.value = next.chartValueColumn
    if (hydrated.value) writeSnapshot(next)
  }

  const resetToDefaults = () => {
    applySettings(DEFAULT_SETTINGS)
  }

  return {
    appTitle,
    themeMode,
    lockFirstColumnByDefault,
    chartLabelColumn,
    chartValueColumn,
    hydrated,
    snapshot,
    hydrate,
    applySettings,
    resetToDefaults,
  }
})
