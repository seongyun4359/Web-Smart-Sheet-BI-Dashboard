<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSheetStore } from '@/store/sheet'

const sheet = useSheetStore()
const { appTitle } = storeToRefs(sheet)
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8">
    <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
      {{ appTitle }}
    </h1>
    <p class="mt-2 text-slate-600 dark:text-slate-400">
      대시보드·그리드·차트는 이후 단계에서 연결합니다.
    </p>
  </div>
</template>
