import { apiFetch, setCsrfToken } from "./client";

export interface AuthUser {
  id: string;
  organization_id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  is_test_data: boolean;
  created_at?: string | null;
  last_login_at?: string | null;
  roles: string[];
}

export interface AuthMeResponse {
  user: AuthUser;
  organization_id: string;
  roles: string[];
  permissions: string[];
}

export interface UserCreateInput {
  organization_id: string;
  email: string;
  display_name: string;
  initial_password: string;
  role_codes: string[];
  is_test_data?: boolean;
}

export interface UserUpdateInput {
  display_name?: string;
  password?: string;
}

export interface UserRoleAssignInput {
  role_codes?: string[];
  role_ids?: string[];
}

export const authApi = {
  getCsrf: async (): Promise<string> => {
    const data = await apiFetch<{ csrf_token: string }>("/api/auth/csrf");
    setCsrfToken(data.csrf_token);
    return data.csrf_token;
  },

  login: async (email: string, password: string): Promise<AuthMeResponse> => {
    const res = await apiFetch<AuthMeResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return res;
  },

  logout: async (): Promise<void> => {
    await apiFetch<{ status: string }>("/api/auth/logout", {
      method: "POST",
    });
    setCsrfToken(null);
  },

  getMe: async (): Promise<AuthMeResponse> => {
    return apiFetch<AuthMeResponse>("/api/auth/me");
  },

  // --- User Administration ---
  listUsers: async (organizationId?: string): Promise<AuthUser[]> => {
    const url = organizationId
      ? `/api/logistics/users?organization_id=${organizationId}`
      : "/api/logistics/users";
    return apiFetch<AuthUser[]>(url);
  },

  createUser: async (data: UserCreateInput): Promise<AuthUser> => {
    return apiFetch<AuthUser>("/api/logistics/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getUser: async (userId: string): Promise<AuthUser> => {
    return apiFetch<AuthUser>(`/api/logistics/users/${userId}`);
  },

  updateUser: async (userId: string, data: UserUpdateInput): Promise<AuthUser> => {
    return apiFetch<AuthUser>(`/api/logistics/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  disableUser: async (userId: string): Promise<AuthUser> => {
    return apiFetch<AuthUser>(`/api/logistics/users/${userId}/disable`, {
      method: "PATCH",
    });
  },

  assignUserRoles: async (
    userId: string,
    data: UserRoleAssignInput
  ): Promise<AuthUser> => {
    return apiFetch<AuthUser>(`/api/logistics/users/${userId}/roles`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};
