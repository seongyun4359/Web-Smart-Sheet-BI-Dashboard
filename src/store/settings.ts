import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'

export type SettingsState = {
  appTitle: string
  themeMode: ThemeMode
  lockFirstColumnByDefault: boolean
}

export const SETTINGS_STORAGE_KEY = 'smart-sheet-ui-settings:v1'

export const DEFAULT_SETTINGS: SettingsState = {
  appTitle: 'Smart-Sheet BI Dashboard',
  themeMode: 'system',
  lockFirstColumnByDefault: false,
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
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const appTitle = ref(DEFAULT_SETTINGS.appTitle)
  const themeMode = ref<ThemeMode>(DEFAULT_SETTINGS.themeMode)
  const lockFirstColumnByDefault = ref(DEFAULT_SETTINGS.lockFirstColumnByDefault)
  const hydrated = ref(false)

  const snapshot = computed<SettingsState>(() => ({
    appTitle: appTitle.value.trim() || DEFAULT_SETTINGS.appTitle,
    themeMode: themeMode.value,
    lockFirstColumnByDefault: lockFirstColumnByDefault.value,
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
    if (hydrated.value) writeSnapshot(next)
  }

  const resetToDefaults = () => {
    applySettings(DEFAULT_SETTINGS)
  }

  return {
    appTitle,
    themeMode,
    lockFirstColumnByDefault,
    hydrated,
    snapshot,
    hydrate,
    applySettings,
    resetToDefaults,
  }
})
