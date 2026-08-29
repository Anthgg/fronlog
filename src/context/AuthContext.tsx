import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthUser, authApi } from "../api/auth";
import { mfaApi } from "../api/mfa";

interface AuthContextType {
  user: AuthUser | null;
  roles: string[];
  permissions: string[];
  organizationId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  refreshMe: () => Promise<void>;
  refreshMfaStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const bootstrapSession = useCallback(async () => {
    try {
      // 1. Fetch CSRF token for future mutating calls
      try {
        await authApi.getCsrf();
      } catch {
        // CSRF bootstrap optional if offline
      }

      // 2. Validate existing HttpOnly cookie session
      const meData = await authApi.getMe();
      setUser(meData.user);
      setRoles(meData.roles || []);
      setPermissions(meData.permissions || []);
      setOrganizationId(meData.organization_id || null);
      setMfaEnabled(!!meData.mfa_enabled);
    } catch {
      // 401 or network error -> clear state
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setOrganizationId(null);
      setMfaEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.getCsrf();
      const res = await authApi.login(email, password);
      setUser(res.user);
      setRoles(res.roles || []);
      setPermissions(res.permissions || []);
      setOrganizationId(res.organization_id || null);
      setMfaEnabled(!!res.mfa_enabled);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      setUser(null);
      setRoles([]);
      setPermissions([]);
      setOrganizationId(null);
      setMfaEnabled(false);
      setIsLoading(false);
    }
  };

  const hasPermission = useCallback(
    (permissionCode: string): boolean => {
      if (!permissionCode) return false;
      const lower = permissionCode.trim().toLowerCase();
      return permissions.some((p) => p.toLowerCase() === lower);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (permissionCodes: string[]): boolean => {
      return permissionCodes.some((code) => hasPermission(code));
    },
    [hasPermission]
  );

  const refreshMe = async (): Promise<void> => {
    await bootstrapSession();
  };

  const refreshMfaStatus = async (): Promise<void> => {
    try {
      const status = await mfaApi.getStatus();
      setMfaEnabled(status.enabled);
    } catch {
      // Ignore error
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        organizationId,
        isAuthenticated: !!user,
        isLoading,
        mfaEnabled,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        refreshMe,
        refreshMfaStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
