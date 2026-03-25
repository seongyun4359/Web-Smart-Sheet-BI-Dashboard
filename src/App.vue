<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-svh bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <header
      class="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80"
    >
      <div class="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
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
  </div>
</template>
