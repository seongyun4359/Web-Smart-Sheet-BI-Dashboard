<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink, RouterView } from 'vue-router'
import ToastHost from '@/components/ToastHost.vue'
import { useSettingsStore } from '@/store/settings'

const settings = useSettingsStore()
const { appTitle, themeMode } = storeToRefs(settings)

const readSystemPrefersDark = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const systemPrefersDark = ref(readSystemPrefersDark())

const isDarkTheme = computed(
  () => themeMode.value === 'dark' || (themeMode.value === 'system' && systemPrefersDark.value),
)

let mediaQuery: MediaQueryList | null = null
let handleSystemThemeChange: ((event: MediaQueryListEvent) => void) | null = null

watch(isDarkTheme, (enabled) => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', enabled)
  document.documentElement.style.colorScheme = enabled ? 'dark' : 'light'
}, { immediate: true })

watch(appTitle, (value) => {
  if (typeof document === 'undefined') return
  document.title = value
}, { immediate: true })

onMounted(() => {
  if (typeof window === 'undefined') return
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemPrefersDark.value = mediaQuery.matches
  handleSystemThemeChange = (event: MediaQueryListEvent) => {
    systemPrefersDark.value = event.matches
  }
  mediaQuery.addEventListener('change', handleSystemThemeChange)
})

onBeforeUnmount(() => {
  if (!mediaQuery || !handleSystemThemeChange) return
  mediaQuery.removeEventListener('change', handleSystemThemeChange)
})
</script>

<template>
  <div class="min-h-svh bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
    <header
      class="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
    >
      <div class="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {{ appTitle }}
          </p>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ themeMode === 'system' ? '시스템 테마 추종' : themeMode === 'dark' ? '다크 모드' : '라이트 모드' }}
          </p>
        </div>
        <nav class="flex gap-4 text-sm font-medium">
          <RouterLink
            to="/"
            class="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            active-class="!text-violet-600 dark:!text-violet-400"
          >
            대시보드
          </RouterLink>
          <RouterLink
            to="/settings"
            class="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            active-class="!text-violet-600 dark:!text-violet-400"
          >
            설정
          </RouterLink>
        </nav>
      </div>
    </header>
    <main>
      <RouterView />
    </main>
    <ToastHost />
  </div>
</template>
