<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
      move-class="transition duration-150 ease-out"
      tag="div"
      class="flex w-full max-w-md flex-col gap-2"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur"
        :class="
          toast.variant === 'success'
            ? 'border-emerald-200 bg-white/95 text-slate-900 dark:border-emerald-900/60 dark:bg-slate-900/95 dark:text-slate-100'
            : 'border-slate-200 bg-white/95 text-slate-900 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100'
        "
        role="status"
        aria-live="polite"
      >
        <span
          class="mt-0.5 inline-flex size-2.5 shrink-0 rounded-full"
          :class="toast.variant === 'success' ? 'bg-emerald-500' : 'bg-violet-500'"
        />
        <p class="min-w-0 flex-1 text-sm font-medium">{{ toast.message }}</p>
        <button
          type="button"
          class="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          @click="removeToast(toast.id)"
        >
          닫기
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
