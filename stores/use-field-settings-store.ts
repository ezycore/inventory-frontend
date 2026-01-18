import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

/**
 * Excluded fields settings per module
 * These fields will be hidden from forms for the current organization
 */
export interface ExcludedFields {
  product?: string[]
  brand?: string[]
  category?: string[]
  [key: string]: string[] | undefined
}

interface FieldSettingsState {
  excludedFields: ExcludedFields
}

interface FieldSettingsActions {
  setExcludedFields: (excludedFields: ExcludedFields) => void
  updateModuleExcludedFields: (module: string, fields: string[]) => void
  isFieldExcluded: (module: string, fieldName: string) => boolean
  getExcludedFieldsForModule: (module: string) => string[]
  reset: () => void
}

type FieldSettingsStore = FieldSettingsState & FieldSettingsActions

const initialState: FieldSettingsState = {
  excludedFields: {},
}

export const useFieldSettingsStore = create<FieldSettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setExcludedFields: (excludedFields: ExcludedFields) => {
          set({ excludedFields })
        },

        updateModuleExcludedFields: (module: string, fields: string[]) => {
          set((state) => ({
            excludedFields: {
              ...state.excludedFields,
              [module]: fields,
            },
          }))
        },

        isFieldExcluded: (module: string, fieldName: string) => {
          const { excludedFields } = get()
          const moduleFields = excludedFields[module] || []
          return moduleFields.includes(fieldName)
        },

        getExcludedFieldsForModule: (module: string) => {
          const { excludedFields } = get()
          return excludedFields[module] || []
        },

        reset: () => {
          set(initialState)
        },
      }),
      {
        name: 'easystock-field-settings',
        partialize: (state) => ({
          excludedFields: state.excludedFields,
        }),
      }
    ),
    { name: 'FieldSettingsStore' }
  )
)

/**
 * Utility function to filter form config based on excluded fields
 * This can be used in any module (products, brands, categories, etc.)
 */
export function filterFormConfig<T extends { sections?: any[]; fields?: any[] }>(
  config: T,
  excludedFields: string[]
): T {
  if (!excludedFields || excludedFields.length === 0) {
    return config
  }

  // Handle section-based config
  if (config.sections) {
    return {
      ...config,
      sections: config.sections.map((section) => ({
        ...section,
        fields: section.fields.filter(
          (field: any) => !excludedFields.includes(field.name)
        ),
      })).filter((section) => section.fields.length > 0), // Remove empty sections
    }
  }

  // Handle flat fields config
  if (config.fields) {
    return {
      ...config,
      fields: config.fields.filter(
        (field: any) => !excludedFields.includes(field.name)
      ),
    }
  }

  return config
}
