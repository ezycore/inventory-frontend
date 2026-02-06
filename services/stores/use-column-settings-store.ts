import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

/**
 * Excluded columns settings per module
 * These columns will be hidden from tables for the current organization
 */
export interface ExcludedColumns {
  product?: string[]
  brand?: string[]
  category?: string[]
  [key: string]: string[] | undefined
}

interface ColumnSettingsState {
  excludedColumns: ExcludedColumns
}

interface ColumnSettingsActions {
  setExcludedColumns: (excludedColumns: ExcludedColumns) => void
  updateModuleExcludedColumns: (module: string, columns: string[]) => void
  isColumnExcluded: (module: string, columnKey: string) => boolean
  getExcludedColumnsForModule: (module: string) => string[]
  reset: () => void
}

type ColumnSettingsStore = ColumnSettingsState & ColumnSettingsActions

const initialState: ColumnSettingsState = {
  excludedColumns: {},
}

export const useColumnSettingsStore = create<ColumnSettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setExcludedColumns: (excludedColumns: ExcludedColumns) => {
          set({ excludedColumns })
        },

        updateModuleExcludedColumns: (module: string, columns: string[]) => {
          set((state) => ({
            excludedColumns: {
              ...state.excludedColumns,
              [module]: columns,
            },
          }))
        },

        isColumnExcluded: (module: string, columnKey: string) => {
          const { excludedColumns } = get()
          const moduleColumns = excludedColumns[module] || []
          return moduleColumns.includes(columnKey)
        },

        getExcludedColumnsForModule: (module: string) => {
          const { excludedColumns } = get()
          return excludedColumns[module] || []
        },

        reset: () => {
          set(initialState)
        },
      }),
      {
        name: 'easystock-column-settings',
        partialize: (state) => ({
          excludedColumns: state.excludedColumns,
        }),
      }
    ),
    { name: 'ColumnSettingsStore' }
  )
)
