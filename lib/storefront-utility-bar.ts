// coding-standard: maintained

/** Stored utility-bar values are optional so existing shops need no migration. */
export interface UtilityBarConfig {
  enabled?: boolean;
  showOnDesktop?: boolean;
  showOnMobile?: boolean;
  showPhone?: boolean;
  showTrackOrder?: boolean;
  showLanguage?: boolean;
  showTheme?: boolean;
  trackOrderLabel?: string;
}

export interface ResolvedUtilityBar {
  enabled: boolean;
  showOnDesktop: boolean;
  showOnMobile: boolean;
  showPhone: boolean;
  showTrackOrder: boolean;
  showLanguage: boolean;
  showTheme: boolean;
  trackOrderLabel: string;
}

/**
 * Resolve the information strip that used to be baked into the Classic header.
 * An old Classic shop therefore keeps its desktop strip, while every other old
 * header keeps rendering exactly as it did. Once saved, the explicit merchant
 * choice is independent of header layout.
 */
export function resolveUtilityBar(
  config: UtilityBarConfig | undefined,
  headerVariant: string | undefined,
): ResolvedUtilityBar {
  return {
    enabled: config?.enabled ?? headerVariant === "classic",
    showOnDesktop: config?.showOnDesktop ?? true,
    showOnMobile: config?.showOnMobile ?? false,
    showPhone: config?.showPhone ?? true,
    showTrackOrder: config?.showTrackOrder ?? true,
    showLanguage: config?.showLanguage ?? true,
    showTheme: config?.showTheme ?? true,
    trackOrderLabel: config?.trackOrderLabel?.trim() ?? "",
  };
}
