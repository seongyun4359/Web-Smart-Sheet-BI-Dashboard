import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSheetStore = defineStore('sheet', () => {
  const appTitle = ref('Smart-Sheet BI Dashboard')

  return { appTitle }
})
