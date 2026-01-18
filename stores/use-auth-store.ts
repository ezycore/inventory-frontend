import { Image } from "@/types";
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
          set({ user, token, isAuthenticated: true });
        },

        clearAuth: () => {
          set(initialState);
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
