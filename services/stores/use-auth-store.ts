import { Image, OrganizationFeatures } from "@/types";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { LoadingState, initialLoadingState } from "./store-utils";

// User data interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: Image; // Single image object, not array
  role: "super_admin" | "admin" | "manager" | "staff" | "viewer";
  permissions: string[];
  /** Array of location IDs the user has access to (admin has all access) */
  locationIds?: string[];
  /** User's default location ID */
  defaultLocationId?: string;
  organization: {
    name: string;
    slug: string;
    ownerId?: string;
    currency?: string;
    timezone?: string;
    logo?: Image;
    settings: {
      excludedFields?: { [key: string]: string[] };
      excludedColumns?: { [key: string]: string[] };
    };
    features?: OrganizationFeatures;
  };
  defaultData: {
    customerId?: string;
    accountId?: string;
    locationId?: string;
    unitId?: string;
  }
}

// Auth state interface
interface AuthState extends LoadingState {
  user: User | null;
  token: string | null;
  /** YoCore-issued refresh token. `null` on the legacy auth path. */
  refreshToken: string | null;
  isAuthenticated: boolean;
  activeLocationId: string | null;
}

// Auth actions interface
interface AuthActions {
  setUser: (user: User, token: string, refreshToken?: string | null) => void;
  /**
   * Phase 3.3c — rotate access + (optionally) refresh tokens after a
   * `/auth/refresh` round-trip without touching the persisted user object.
   */
  setTokens: (token: string, refreshToken?: string | null) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  hydrateAuth: () => void;
  setActiveLocation: (locationId: string) => void;
  updateFeatures: (features: OrganizationFeatures) => void;
}

// Combined auth store type
type AuthStore = AuthState & AuthActions;

// Initial state
const initialState: AuthState = {
  ...initialLoadingState,
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  activeLocationId: null,
};

// Cookie names — read by `proxy.ts` (auth-token) and the api-client refresh
// interceptor (auth-refresh-token).
const AUTH_TOKEN_COOKIE = "auth-token";
const REFRESH_TOKEN_COOKIE = "auth-refresh-token";
const ACTIVE_LOCATION_COOKIE = "active-location";
const COOKIE_OPTS = {
  maxAge: 60 * 60 * 24 * 7,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

// Create the auth store with persistence
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setUser: (
          user: User,
          token: string,
          refreshToken: string | null = null,
        ) => {
          // Determine active location: user's default or organization's default
          const activeLocationId = user.defaultLocationId || null;

          // Store in Zustand
          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            activeLocationId,
          });

          // Store token in cookie for middleware access
          setCookie(AUTH_TOKEN_COOKIE, token, COOKIE_OPTS);
          if (refreshToken) {
            setCookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTS);
          } else {
            deleteCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
          }

          // Store active location in cookie for API interceptor
          if (activeLocationId) {
            setCookie(ACTIVE_LOCATION_COOKIE, activeLocationId, COOKIE_OPTS);
          }
        },

        setTokens: (token: string, refreshToken: string | null = null) => {
          set({ token, refreshToken });
          setCookie(AUTH_TOKEN_COOKIE, token, COOKIE_OPTS);
          if (refreshToken) {
            setCookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTS);
          }
        },

        updateUser: (updates: Partial<User>) => {
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = { ...currentUser, ...updates };
            set({ user: updatedUser });

            // Update active location if default changed
            if (updates.defaultLocationId) {
              set({ activeLocationId: updates.defaultLocationId });
              setCookie(
                ACTIVE_LOCATION_COOKIE,
                updates.defaultLocationId,
                COOKIE_OPTS,
              );
            }
          }
        },
        updateFeatures: (features: OrganizationFeatures) => {
          const currentUser = get().user;
          if (currentUser) {
            const updatedOrganization = {
              ...currentUser.organization,
              features,
            };
            const updatedUser = {
              ...currentUser,
              organization: updatedOrganization,
            };
            set({ user: updatedUser });
          }
        },

        clearAuth: () => {
          set(initialState);

          deleteCookie(AUTH_TOKEN_COOKIE, { path: "/" });
          deleteCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
          deleteCookie(ACTIVE_LOCATION_COOKIE, { path: "/" });
        },

        hydrateAuth: () => {
          // Check if token exists in cookie but not in state (after hard refresh)
          const cookieToken = getCookie(AUTH_TOKEN_COOKIE);
          const { token: stateToken } = get();

          if (cookieToken && !stateToken) {
            // Cookie exists but state is empty - should not happen normally
            // Clear the cookie to stay in sync
            deleteCookie(AUTH_TOKEN_COOKIE, { path: "/" });
            deleteCookie(REFRESH_TOKEN_COOKIE, { path: "/" });
            deleteCookie(ACTIVE_LOCATION_COOKIE, { path: "/" });
          } else if (!cookieToken && stateToken) {
            // State exists but cookie doesn't - clear state
            set(initialState);
          }
        },

        setActiveLocation: (locationId: string) => {
          const { user } = get();

          // For non-admin users, validate the location is in their assigned list
          if (user && user.role !== "admin") {
            const hasAccess = user.locationIds?.includes(locationId);
            if (!hasAccess) {
              console.warn(
                "User does not have access to location:",
                locationId,
              );
              return;
            }
          }

          set({ activeLocationId: locationId });

          // Update cookie for API interceptor
          setCookie(ACTIVE_LOCATION_COOKIE, locationId, COOKIE_OPTS);
        },
      }),
      {
        name: "easystock-auth",
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
          activeLocationId: state.activeLocationId,
        }),
      },
    ),
    { name: "AuthStore" },
  ),
);
