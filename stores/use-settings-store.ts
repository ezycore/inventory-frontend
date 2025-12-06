import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface GlobalSettings {
 currency: string
 timezone: string
 dateFormat: string
 timeFormat: string
}

interface SettingsActions {
 setSettings: (settings: Partial<GlobalSettings>) => void
 resetSettings: () => void
}

const defaultSettings: GlobalSettings = {
 currency: 'BDT',
 timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
 dateFormat: 'dd-MM-yyyy',
 timeFormat: 'HH:mm a',
}

// Date formats
// format(date, 'yyyy-MM-dd')           // 2024-12-06
// format(date, 'dd/MM/yyyy')           // 06/12/2024
// format(date, 'MM/dd/yyyy')           // 12/06/2024
// format(date, 'PPP')                  // December 6th, 2024
// format(date, 'PP')                   // Dec 6, 2024

// // Time formats
// format(date, 'HH:mm:ss')             // 15:30:45 (24-hour)
// format(date, 'hh:mm a')              // 03:30 PM (12-hour)
// format(date, 'p')                    // 3:30 PM

// // Combined formats
// format(date, 'PPpp')                 // Dec 6, 2024, 3:30:45 PM
// format(date, 'yyyy-MM-dd HH:mm:ss')  // 2024-12-06 15:30:45
// format(date, "MMM d, yyyy 'at' h:mm a") // Dec 6, 2024 at 3:30 PM

// // Relative time
// formatDistanceToNow(date, { addSuffix: true }) // "2 hours ago"

export const useSettingsStore = create<SettingsActions & GlobalSettings>()(
 devtools(
  persist(
   (set) => ({
    ...defaultSettings,
    setSettings: (settings: Partial<GlobalSettings>) =>
     set((state) => ({
      ...state,
      ...settings,
     })),
    resetSettings: () => set(() => ({ ...defaultSettings })),
   }),
   {
    name: 'easystock-settings',
    partialize: (state) => ({
     currency: state.currency,
     timezone: state.timezone,
     dateFormat: state.dateFormat,
     timeFormat: state.timeFormat,
    }),
   }
  ),
  { name: 'SettingsStore' }
 )
)