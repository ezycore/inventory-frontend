import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { BaseActions, LoadingState, initialLoadingState } from "./store-utils";
import { setGlobal401Handler } from "@/lib/api-client";

// User data interface
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin" | "owner";
  permissions: string[];
  organizationName?: string;
  preferences: {
    theme: "light" | "dark" | "system";
    currency: string;
    timezone: string;
    language?: string;
  };
}

// Auth state interface
interface AuthState extends LoadingState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
}

// Auth actions interface
interface AuthActions extends BaseActions {
  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  updateUserPreferences: (preferences: Partial<User["preferences"]>) => void;
  clearAuth: () => void;
}

// Combined auth store type
type AuthStore = AuthState & AuthActions;

// Initial state
const initialState: AuthState = {
  ...initialLoadingState,
  user: null,
  isAuthenticated: false,
  accessToken: null,
};

// Create the auth store with persistence
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setAuth: (user, accessToken) => {
          set({
            user,
            accessToken,
            isAuthenticated: true,
          });
        },

        setUser: (user: User) => {
          set({ user, isAuthenticated: true });
        },

        setAccessToken: (token: string) => {
          console.log("Setting token in store", token);
          set({ accessToken: token });
        },

        updateUserPreferences: (preferences: Partial<User["preferences"]>) => {
          const { user } = get();
          if (user) {
            set({
              user: {
                ...user,
                preferences: { ...user.preferences, ...preferences },
              },
            });
          }
        },

        clearAuth: () => {
          set(initialState);
        },

        reset: () => {
          set(initialState);
        },
      }),
      {
        name: "easystock-auth",
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: "AuthStore" }
  )
);

if (typeof window !== "undefined") {
  let isRedirecting = false; // Prevent multiple redirects
  
  setGlobal401Handler(() => {
    // Prevent multiple simultaneous 401 redirects
    if (isRedirecting) return;
    
    isRedirecting = true;
    const { clearAuth } = useAuthStore.getState();
    clearAuth();
    // Redirect to login page
    window.location.href = "/login";
  });

}
