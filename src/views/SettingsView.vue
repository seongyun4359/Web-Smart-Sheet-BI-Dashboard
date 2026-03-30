<script setup lang="ts">
import { computed, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/store/settings'

const settings = useSettingsStore()
const { snapshot } = storeToRefs(settings)
const { applySettings, resetToDefaults } = settings
const { showToast } = useToast()

const form = reactive({
  appTitle: settings.appTitle,
  themeMode: settings.themeMode,
  lockFirstColumnByDefault: settings.lockFirstColumnByDefault,
})

const syncForm = () => {
  form.appTitle = settings.appTitle
  form.themeMode = settings.themeMode
  form.lockFirstColumnByDefault = settings.lockFirstColumnByDefault
}

const themeHint = computed(() => {
  if (form.themeMode === 'system') return 'OS 테마 설정을 따릅니다.'
  if (form.themeMode === 'dark') return '항상 어두운 화면으로 표시합니다.'
  return '항상 밝은 화면으로 표시합니다.'
})

const hasChanges = computed(() => {
  const current = snapshot.value
  return (
    form.appTitle.trim() !== current.appTitle ||
    form.themeMode !== current.themeMode ||
    form.lockFirstColumnByDefault !== current.lockFirstColumnByDefault
  )
})

const applyLabel = computed(() => {
  if (form.themeMode !== snapshot.value.themeMode) {
    if (form.themeMode === 'dark') return '다크 모드 적용'
    if (form.themeMode === 'light') return '라이트 모드 적용'
    return '시스템 테마 적용'
  }
  return '변경사항 적용'
})

const applyChanges = () => {
  if (!hasChanges.value) return
  const themeChanged = form.themeMode !== snapshot.value.themeMode
  applySettings({
    appTitle: form.appTitle,
    themeMode: form.themeMode,
    lockFirstColumnByDefault: form.lockFirstColumnByDefault,
  })
  syncForm()
  showToast(
    themeChanged
      ? form.themeMode === 'dark'
        ? '다크 모드가 적용되었습니다.'
        : form.themeMode === 'light'
          ? '라이트 모드가 적용되었습니다.'
          : '시스템 테마를 따르도록 저장되었습니다.'
      : '설정이 저장되었습니다.',
  )
}

const restoreDefaults = () => {
  resetToDefaults()
  syncForm()
  showToast('기본 설정으로 복원되었습니다.')
}

const discardChanges = () => {
  syncForm()
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6 px-4 py-8">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
        UI 설정
      </h1>
      <p class="text-sm text-slate-600 dark:text-slate-400">
        값을 수정한 뒤 적용하면 이 브라우저에 저장되며, 다음 방문 때도 유지됩니다.
      </p>
    </header>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">기본 표시</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            앱 이름과 전체 화면 테마를 조정합니다.
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          @click="restoreDefaults"
        >
          기본값 복원
        </button>
      </div>

      <div class="mt-5 space-y-5">
        <label class="block space-y-2">
          <span class="text-sm font-medium text-slate-800 dark:text-slate-200">앱 제목</span>
          <input
            v-model="form.appTitle"
            type="text"
            maxlength="60"
            class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-violet-500 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
            placeholder="Smart-Sheet BI Dashboard"
          />
          <p class="text-xs text-slate-500 dark:text-slate-400">
            브라우저 제목과 대시보드 헤더에 바로 반영됩니다.
          </p>
        </label>

        <fieldset class="space-y-3">
          <legend class="text-sm font-medium text-slate-800 dark:text-slate-200">테마 모드</legend>
          <div class="grid gap-3 sm:grid-cols-3">
            <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600">
              <input v-model="form.themeMode" type="radio" value="system" class="mt-1" />
              <span>
                <span class="block text-sm font-medium text-slate-900 dark:text-slate-100">시스템</span>
                <span class="block text-xs text-slate-500 dark:text-slate-400">OS 설정 사용</span>
              </span>
            </label>
            <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600">
              <input v-model="form.themeMode" type="radio" value="light" class="mt-1" />
              <span>
                <span class="block text-sm font-medium text-slate-900 dark:text-slate-100">라이트</span>
                <span class="block text-xs text-slate-500 dark:text-slate-400">밝은 배경 유지</span>
              </span>
            </label>
            <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600">
              <input v-model="form.themeMode" type="radio" value="dark" class="mt-1" />
              <span>
                <span class="block text-sm font-medium text-slate-900 dark:text-slate-100">다크</span>
                <span class="block text-xs text-slate-500 dark:text-slate-400">어두운 배경 유지</span>
              </span>
            </label>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ themeHint }}</p>
        </fieldset>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">대시보드 기본값</h2>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
        대시보드를 다시 열었을 때 기본으로 적용할 동작입니다.
      </p>

      <label class="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <input
          v-model="form.lockFirstColumnByDefault"
          type="checkbox"
          class="mt-1 size-4 rounded border-slate-400 text-violet-600 focus:ring-violet-500"
        />
        <span>
          <span class="block text-sm font-medium text-slate-900 dark:text-slate-100">
            첫 데이터 열 잠금 기본값
          </span>
          <span class="mt-1 block text-xs text-slate-500 dark:text-slate-400">
            키, 코드, 식별자 열을 자주 다룰 때 대시보드 진입 시 바로 잠금 상태로 시작합니다.
          </span>
        </span>
      </label>
    </section>

    <section class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/40">
      <p class="text-sm text-slate-600 dark:text-slate-400">
        {{ hasChanges ? '저장되지 않은 변경사항이 있습니다.' : '현재 저장된 설정과 동일합니다.' }}
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-if="hasChanges"
          type="button"
          class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          @click="discardChanges"
        >
          변경 취소
        </button>
        <button
          type="button"
          class="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          :disabled="!hasChanges"
          @click="applyChanges"
        >
          {{ applyLabel }}
        </button>
      </div>
    </section>

    <section class="rounded-2xl border border-dashed border-slate-300 px-5 py-4 dark:border-slate-700">
      <p class="text-sm text-slate-600 dark:text-slate-400">
        현재 편집값:
        <strong class="font-semibold text-slate-900 dark:text-slate-100">{{ form.appTitle.trim() || 'Smart-Sheet BI Dashboard' }}</strong>
        · 테마 <strong class="font-semibold text-slate-900 dark:text-slate-100">{{ form.themeMode }}</strong>
        · 첫 열 잠금 기본값
        <strong class="font-semibold text-slate-900 dark:text-slate-100">
          {{ form.lockFirstColumnByDefault ? '켜짐' : '꺼짐' }}
        </strong>
      </p>
    </section>
  </div>
</template>
