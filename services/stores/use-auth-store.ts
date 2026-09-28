import {
  Image,
  OrganizationFeatures,
  VatSettings,
  VatRegistrationEntry,
} from "@/types";
import type { ReceiptSettings } from "@/types/receipt";
import type { AppLocale } from "@/i18n/config";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { LoadingState, initialLoadingState } from "./store-utils";
import { resolveFeatureMap } from "@/lib/feature-utils";

// User data interface
export interface User {
  // Optionality mirrors the backend `authUserDto` (the generated `Me`/`AuthUser`): these are
  // populate/resolve outputs the shared user contract doesn't guarantee on every user shape.
  _id?: string;
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: Image; // Single image object, not array
  /** Preferred UI language — source of truth; mirrored into NEXT_LOCALE (docs/I18N.md). */
  locale?: AppLocale;
  role: string;
  permissions?: string[];
  /** Array of assigned location IDs; roles with locations.all can access all locations. */
  locationIds?: string[];
  /** User's default location ID */
  defaultLocationId?: string;
  organization?: {
    name: string;
    slug: string;
    ownerId?: string;
    currency?: string;
    /** IANA zone every merchant-facing day is cut in — read via `useOrgCalendar`. */
    timezone?: string;
    /** 0=Sun … 6=Sat; absent on older orgs, which read as Sunday. */
    weekStartDay?: number;
    logo?: Image;
    /**
     * Browser-tab icon, and the only source of one — never derived from `logo`.
     * An org without it shows the platform mark rather than a cover-cropped
     * wordmark. Read by `useOrgFavicon`; must stay in the `populate` select in
     * the backend `auth.service`, or it silently arrives undefined after login.
     */
    favicon?: Image;
    /** Business address — printed on invoices/receipts/returns. */
    address?: string;
    /** Letterhead / print configuration — see {@link ReceiptSettings}. */
    receiptSettings?: ReceiptSettings;
    settings?: {
      excludedFields?: { [key: string]: string[] };
      excludedColumns?: { [key: string]: string[] };
    };
    features?: OrganizationFeatures;
    /**
     * The plan CEILING, alongside the enforced `features` above.
     *
     * Both are needed or no screen can tell "you switched this off" from "your
     * plan does not include this" — the first is one free click, the second
     * costs money, and a lock screen that cannot distinguish them can only show
     * a generic error. `RouteAccessGuard` reads exactly this pair. Must stay in
     * the `populate` select in the backend `auth.service`, or it silently
     * arrives undefined and every lock degrades to the upsell.
     */
    planFeatures?: OrganizationFeatures;
    /**
     * When the org first rang a counter (POS) sale. Keeps Sales History and the
     * Sales Report in the menu after POS is switched off
     * (docs/plan/orders-first-storefront.md D1/D4). In the backend populate
     * select, like `planFeatures`.
     */
    posUsedAt?: string | null;
    /** Admin-configurable VAT settings (BIN, default rate, price semantics). */
    vatSettings?: VatSettings;
    /**
     * Dated VAT registration history. The entry in force on a document's date
     * decides its VAT treatment — never "the current status".
     */
    vatRegistrationHistory?: VatRegistrationEntry[];
    /** Progress of background sample-data seeding; presence ⇒ workspace holds sample data. */
    demoSeedStatus?: "pending" | "seeding" | "ready" | "failed";
    /**
     * Trade the merchant picked at signup. The setup wizard reads it to pre-fill
     * its recommendations — never to decide them.
     */
    industry?: string;
    /**
     * Set when the owner finishes the setup wizard. Null/absent gates the whole
     * workspace: the protected layout sends anyone who can configure the org to
     * `/onboarding` until it is stamped. Must be listed in the backend's org
     * populate select AND the auth DTO, or it silently arrives undefined and
     * the gate never fires (docs/plan/onboarding-workspace.md §5.1).
     */
    onboardingCompletedAt?: string | null;
    /** Resume point for the wizard; cannot be derived, since every feature starts ON. */
    onboardingStep?: number;
  };
  defaultData?: {
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
  isAuthenticated: boolean;
  activeLocationId: string | null;
  /**
   * Set only when THIS browser is a Mission Control support session
   * (`mission-control/plan/support-session.md`). It is what lets the banner tell
   * the operator's view apart from the merchant's — both see a live session, but
   * only one of them is in it.
   *
   * Never set by an ordinary login, so every other code path can keep assuming
   * it is null.
   */
  supportSessionId: string | null;
}

// Auth actions interface
interface AuthActions {
  setUser: (user: User, token: string) => void;
  /**
   * Adopt a support session: the same thing `setUser` does, plus the session id
   * the banner keys on. Deliberately a separate action rather than an extra
   * argument — a support session is a different kind of sign-in, and making it
   * look identical at the call site is how it would end up mistaken for one.
   */
  setSupportSession: (user: User, token: string, sessionId: string) => void;
  /** Swap the bearer token without touching the session around it. */
  setToken: (token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  clearAuth: () => void;
  hydrateAuth: () => void;
  setActiveLocation: (locationId: string) => void;
  updateFeatures: (
    features: OrganizationFeatures,
    planFeatures?: OrganizationFeatures,
  ) => void;
  /** Mark the setup wizard finished so the workspace gate stops redirecting. */
  setOnboardingCompleted: (completedAt: string) => void;
  updateTaxConfig: (config: {
    vatSettings?: VatSettings;
    vatRegistrationHistory?: VatRegistrationEntry[];
  }) => void;
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
  supportSessionId: null,
};

/**
 * The user with both organization feature maps resolved by the backend's rule —
 * a missing key is ON (`resolveFeatureMap`). Every path that writes `user` goes
 * through this, so no screen ever reads a raw map from the API or from storage.
 */
function withResolvedFeatures(user: User): User {
  const organization = user.organization;
  if (!organization) return user;
  return {
    ...user,
    organization: {
      ...organization,
      ...(organization.features && {
        features: resolveFeatureMap(organization.features),
      }),
      ...(organization.planFeatures && {
        planFeatures: resolveFeatureMap(organization.planFeatures),
      }),
    },
  };
}

// Create the auth store with persistence
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setUser: (incoming: User, token: string) => {
          // A session without a bearer is worse than no session: `user` and
          // `isAuthenticated` make every screen render as signed in, while
          // `api-client` sends no `Authorization` header — so the first request
          // 401s and the app bounces to /login, over and over. `tsconfig` has
          // `strict: false`, so a `string | null` reaching this `string`
          // parameter is not a compile error; this is the only guard there is.
          // Keep whatever token the session already holds (a caller refreshing
          // the user from `/auth/me`, which returns no token), and refuse to
          // mint a signed-in state that has none at all.
          const nextToken = token || get().token;
          if (!nextToken) return;

          const user = withResolvedFeatures(incoming);
          // Determine active location: user's default or organization's default
          const activeLocationId = user.defaultLocationId || null;

          // Store in Zustand
          set({ user, token: nextToken, isAuthenticated: true, activeLocationId });

          // Store token in cookie for middleware access
          setCookie("auth-token", nextToken, {
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

        setSupportSession: (user: User, token: string, sessionId: string) => {
          get().setUser(user, token);
          set({ supportSessionId: sessionId });
        },

        // Replace only the token — used after a password change, where the
        // backend retires every existing session and hands back a fresh token so
        // THIS device stays signed in. Deliberately not `setUser`: that recomputes
        // `activeLocationId` from the user's default and would silently throw away
        // whichever location they had switched to.
        setToken: (token: string) => {
          // Same reason as `setUser`: dropping the bearer while the rest of the
          // session stands leaves a signed-in-looking store that cannot make a
          // single authenticated request.
          if (!token) return;
          set({ token });

          setCookie("auth-token", token, {
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        },

        updateUser: (updates: Partial<User>) => {
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = withResolvedFeatures({ ...currentUser, ...updates });
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
        /**
         * Sync the feature pair after a toggle or a fresh read.
         *
         * `planFeatures` is optional only because it rarely moves — a merchant
         * toggle never changes the ceiling. Pass it whenever the response
         * carries it (the features endpoint returns both), because the lock
         * screens read the two TOGETHER to tell "you switched this off" from
         * "not in your plan". Storing one and not the other is the same shape
         * of bug as a field left out of the org update block: correct after a
         * reload, wrong until then.
         */
        updateFeatures: (
          features: OrganizationFeatures,
          planFeatures?: OrganizationFeatures,
        ) => {
          const currentUser = get().user;
          if (currentUser) {
            const updatedOrganization = {
              ...currentUser.organization,
              features: resolveFeatureMap(features),
              ...(planFeatures ? { planFeatures: resolveFeatureMap(planFeatures) } : {}),
            };
            const updatedUser = {
              ...currentUser,
              organization: updatedOrganization,
            };
            set({ user: updatedUser });
          }
        },
        /**
         * Stamp the wizard as finished on the *client* too.
         *
         * The workspace gate reads `onboardingCompletedAt` from this store, not
         * from the features query — so without this the merchant who just
         * pressed "Start using Ezycore" is bounced straight back to
         * `/onboarding` by a stale `null`, while the wizard reads the fresh
         * value from its own cache and sends them to `/dashboard` again. That
         * ping-pong is invisible in tests and immediate in a browser.
         */
        setOnboardingCompleted: (completedAt: string) => {
          const currentUser = get().user;
          if (!currentUser) return;
          set({
            user: {
              ...currentUser,
              organization: {
                ...currentUser.organization,
                onboardingCompletedAt: completedAt,
              },
            },
          });
        },
        updateTaxConfig: ({ vatSettings, vatRegistrationHistory }) => {
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                organization: {
                  ...currentUser.organization,
                  ...(vatSettings && { vatSettings }),
                  ...(vatRegistrationHistory && { vatRegistrationHistory }),
                },
              },
            });
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

          const hasAllLocationAccess =
            !!user?.permissions?.includes("locations.all") ||
            !!user?.permissions?.includes("locations.manage");
          if (user && !hasAllLocationAccess) {
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
        // A session persisted before the feature maps were resolved on the way
        // in still holds the raw ones; resolve on rehydration too, or a reload
        // brings the hidden modules back until the next `/auth/me`.
        merge: (persisted, current) => {
          const state = persisted as Partial<AuthStore> | undefined;
          return {
            ...current,
            ...state,
            user: state?.user ? withResolvedFeatures(state.user) : current.user,
          };
        },
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
          activeLocationId: state.activeLocationId,
          // Persisted so a page refresh mid-session does not turn the operator's
          // banner into the merchant's — the app would then offer them a button
          // labelled as if someone else were the one being watched.
          supportSessionId: state.supportSessionId,
        }),
      },
    ),
    { name: "AuthStore" },
  ),
);
