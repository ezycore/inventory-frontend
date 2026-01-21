import {
  DEFAULT_ORGANIZATION_FEATURES,
  FeatureName,
  OrganizationFeatures,
} from "@/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface GlobalSettings {
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

interface SettingsActions {
  setSettings: (settings: Partial<GlobalSettings>) => void;
  resetSettings: () => void;
  setFeatures: (features: Partial<OrganizationFeatures>) => void;
  updateFeature: (feature: FeatureName, enabled: boolean) => void;
  isFeatureEnabled: (feature: FeatureName) => boolean;
  resetFeatures: () => void;
}

interface FeaturesState {
  features: OrganizationFeatures;
}

const defaultSettings: GlobalSettings = {
  currency: "BDT",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  dateFormat: "dd-MM-yyyy",
  timeFormat: "HH:mm a",
};

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

export const useSettingsStore = create<
  SettingsActions & GlobalSettings & FeaturesState
>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultSettings,
        features: { ...DEFAULT_ORGANIZATION_FEATURES },

        setSettings: (settings: Partial<GlobalSettings>) =>
          set((state) => ({
            ...state,
            ...settings,
          })),

        resetSettings: () => set(() => ({ ...defaultSettings })),

        setFeatures: (features: Partial<OrganizationFeatures>) =>
          set((state) => ({
            features: { ...state.features, ...features },
          })),

        updateFeature: (feature: FeatureName, enabled: boolean) =>
          set((state) => ({
            features: { ...state.features, [feature]: enabled },
          })),

        isFeatureEnabled: (feature: FeatureName) => {
          return get().features[feature] === true;
        },

        resetFeatures: () =>
          set(() => ({ features: { ...DEFAULT_ORGANIZATION_FEATURES } })),
      }),
      {
        name: "easystock-settings",
        partialize: (state) => ({
          currency: state.currency,
          timezone: state.timezone,
          dateFormat: state.dateFormat,
          timeFormat: state.timeFormat,
          features: state.features,
        }),
      }
    ),
    { name: "SettingsStore" }
  )
);