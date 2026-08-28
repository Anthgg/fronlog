const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface RoleResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  organization_id: string | null;
  is_system: boolean;
  is_active: boolean;
  is_test_data: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleCreate {
  code: string;
  name: string;
  description?: string;
  organization_id?: string | null;
  is_system?: boolean;
  is_active?: boolean;
  is_test_data?: boolean;
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface RoleResponsibilityItem {
  role_code: string;
  role_name: string;
  responsibilities: string[];
  operational_scope: string;
}

export interface SodConflictItem {
  role_a: string;
  role_b: string;
  conflict_level: 'HIGH_RISK' | 'REVIEW_REQUIRED' | 'NONE';
  reason: string;
  policy: string;
}

export interface RoleMatrixResponse {
  canonical_profiles: RoleResponsibilityItem[];
  sod_conflicts: SodConflictItem[];
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData: ApiErrorResponse;
    try {
      errorData = await res.json();
    } catch {
      errorData = {
        code: 'HTTP_ERROR',
        message: `Error HTTP ${res.status}: ${res.statusText}`,
      };
    }
    throw errorData;
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export const rolesApi = {
  listRoles: async (organizationId?: string): Promise<RoleResponse[]> => {
    const url = organizationId
      ? `${API_BASE_URL}/api/logistics/roles?organization_id=${organizationId}`
      : `${API_BASE_URL}/api/logistics/roles`;
    const res = await fetch(url);
    return handleResponse<RoleResponse[]>(res);
  },

  getRole: async (roleId: string): Promise<RoleResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/logistics/roles/${roleId}`);
    return handleResponse<RoleResponse>(res);
  },

  getMatrix: async (): Promise<RoleMatrixResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/logistics/roles/matrix`);
    return handleResponse<RoleMatrixResponse>(res);
  },

  createRole: async (data: RoleCreate): Promise<RoleResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/logistics/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<RoleResponse>(res);
  },

  updateRole: async (roleId: string, data: RoleUpdate): Promise<RoleResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/logistics/roles/${roleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<RoleResponse>(res);
  },

  deleteRole: async (roleId: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/api/logistics/roles/${roleId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },
};
