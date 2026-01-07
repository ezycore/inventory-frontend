/**
 * Auth API - using fetch directly since these are Next.js API routes
 */
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || result.message || "Login failed");
    }

    return result;
  },

  logout: async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    return response.json();
  },
};
