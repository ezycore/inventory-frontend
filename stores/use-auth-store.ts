import { Image } from "@/types";
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
  avatar?: Image[];
  role: "super_admin" | "admin" | "manager" | "staff" | "viewer";
  status: "active" | "inactive";
  permissions: string[];
  organization: {
    name: string;
    slug: string;
    country: string;
    timezone: string;
    currency: string;
    address?: string;
    image?: Image[];
    status: "active" | "inactive";
    settings: {
      excludedFields?: { [key: string]: string[] };
    };
  };
}

// Auth state interface
interface AuthState extends LoadingState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Auth actions interface
interface AuthActions {
  setUser: (user: User, token: string) => void;
  clearAuth: () => void;
  hydrateAuth: () => void;
}

// Combined auth store type
type AuthStore = AuthState & AuthActions;

// Initial state
const initialState: AuthState = {
  ...initialLoadingState,
  user: null,
  token: null,
  isAuthenticated: false,
};

// Create the auth store with persistence
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setUser: (user: User, token: string) => {
          // Store in Zustand
          set({ user, token, isAuthenticated: true });

          // Store token in cookie for middleware access
          setCookie("auth-token", token, {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        },

        clearAuth: () => {
          set(initialState);

          // Remove token cookie
          deleteCookie("auth-token", { path: "/" });
        },

        hydrateAuth: () => {
          // Check if token exists in cookie but not in state (after hard refresh)
          const cookieToken = getCookie("auth-token");
          const { token: stateToken } = get();

          if (cookieToken && !stateToken) {
            // Cookie exists but state is empty - should not happen normally
            // Clear the cookie to stay in sync
            deleteCookie("auth-token", { path: "/" });
          } else if (!cookieToken && stateToken) {
            // State exists but cookie doesn't - clear state
            set(initialState);
          }
        },
      }),
      {
        name: "easystock-auth",
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: "AuthStore" },
  ),
);
