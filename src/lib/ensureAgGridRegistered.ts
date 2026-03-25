import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

let registered = false

/** 대시보드 등 AG Grid 사용 화면에서 1회만 호출 */
export function ensureAgGridRegistered(): void {
  if (registered) return
  ModuleRegistry.registerModules([AllCommunityModule])
  registered = true
}
