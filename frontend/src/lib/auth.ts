export function getAuthToken(): string | null {
  return sessionStorage.getItem("auth_token");
}

export function getAuthUser(): {
  id?: string;
  email?: string;
  role?: string;
  organizationId?: string;
  orgName?: string;
} {
  try {
    return JSON.parse(sessionStorage.getItem("auth_user") || "{}");
  } catch {
    return {};
  }
}

export function clearAuth(): void {
  sessionStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_user");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-changed"));
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
