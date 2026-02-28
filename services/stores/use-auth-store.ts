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
  fullName: string;
  phone?: string;
  avatar?: Image; // Single image object, not array
  role: "super_admin" | "admin" | "manager" | "staff" | "viewer";
  status: "active" | "inactive";
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
  }
}

// Auth state interface
interface AuthState extends LoadingState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeLocationId: string | null;
}

// Auth actions interface
interface AuthActions {
  setUser: (user: User, token: string) => void;
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
  isAuthenticated: false,
  activeLocationId: null,
};

// Create the auth store with persistence
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setUser: (user: User, token: string) => {
          // Determine active location: user's default or organization's default
          const activeLocationId = user.defaultLocationId || null;

          // Store in Zustand
          set({ user, token, isAuthenticated: true, activeLocationId });

          // Store token in cookie for middleware access
          setCookie("auth-token", token, {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });

          // Store active location in cookie for API interceptor
          if (activeLocationId) {
            setCookie("active-location", activeLocationId, {
              maxAge: 60 * 60 * 24 * 7, // 7 days
              path: "/",
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            });
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
              setCookie("active-location", updates.defaultLocationId, {
                maxAge: 60 * 60 * 24 * 7,
                path: "/",
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
              });
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

          // Remove token cookie
          deleteCookie("auth-token", { path: "/" });
          // Remove active location cookie
          deleteCookie("active-location", { path: "/" });
        },

        hydrateAuth: () => {
          // Check if token exists in cookie but not in state (after hard refresh)
          const cookieToken = getCookie("auth-token");
          const { token: stateToken } = get();

          if (cookieToken && !stateToken) {
            // Cookie exists but state is empty - should not happen normally
            // Clear the cookie to stay in sync
            deleteCookie("auth-token", { path: "/" });
            deleteCookie("active-location", { path: "/" });
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
          setCookie("active-location", locationId, {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        },
      }),
      {
        name: "easystock-auth",
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          activeLocationId: state.activeLocationId,
        }),
      },
    ),
    { name: "AuthStore" },
  ),
);
