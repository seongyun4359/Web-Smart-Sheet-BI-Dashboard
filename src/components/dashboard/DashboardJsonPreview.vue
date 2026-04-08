<script setup lang="ts">
defineProps<{
  jsonPreview: string
}>()
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-700"
  >
    <pre class="max-h-[560px] overflow-auto p-4 text-left text-xs leading-relaxed text-emerald-100/90">{{
      jsonPreview
    }}</pre>
  </div>
</template>
