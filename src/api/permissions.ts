const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface PermissionResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  resource: string;
  action: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  is_system: boolean;
  is_active: boolean;
  future_phase_owner: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleEffectivePermissionsResponse {
  role_id: string;
  role_code: string;
  role_name: string;
  is_system: boolean;
  permissions: PermissionResponse[];
  effective_codes: string[];
  sod_warnings: Array<{
    role_a: string;
    role_b: string;
    conflict_level: 'HIGH_RISK' | 'REVIEW_REQUIRED' | 'NONE';
    reason: string;
    policy: string;
  }>;
}

export interface RolePermissionAssignRequest {
  permission_ids?: string[];
  permission_codes?: string[];
}

export interface EndpointPermissionMappingResponse {
  endpoint: string;
  method: string;
  required_permission: string;
  phase: string;
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

export const permissionsApi = {
  listPermissions: async (category?: string): Promise<PermissionResponse[]> => {
    const url = category
      ? `${API_BASE_URL}/api/logistics/permissions?category=${encodeURIComponent(category)}`
      : `${API_BASE_URL}/api/logistics/permissions`;
    const res = await fetch(url);
    return handleResponse<PermissionResponse[]>(res);
  },

  getPermission: async (permissionId: string): Promise<PermissionResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/logistics/permissions/${permissionId}`);
    return handleResponse<PermissionResponse>(res);
  },

  getRolePermissions: async (roleId: string): Promise<RoleEffectivePermissionsResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/logistics/roles/${roleId}/permissions`);
    return handleResponse<RoleEffectivePermissionsResponse>(res);
  },

  assignRolePermissions: async (
    roleId: string,
    data: RolePermissionAssignRequest
  ): Promise<RoleEffectivePermissionsResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/logistics/roles/${roleId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<RoleEffectivePermissionsResponse>(res);
  },

  getEndpointMatrix: async (): Promise<EndpointPermissionMappingResponse[]> => {
    const res = await fetch(`${API_BASE_URL}/api/logistics/permissions/endpoint-matrix`);
    return handleResponse<EndpointPermissionMappingResponse[]>(res);
  },
};
