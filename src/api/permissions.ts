import { apiFetch } from './client';

export interface PermissionResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  resource: string;
  action: string;
  risk_level: string;
  is_system: boolean;
  is_active: boolean;
  future_phase_owner: string | null;
}

export interface RoleEffectivePermissionsResponse {
  role_id: string;
  role_code: string;
  is_system: boolean;
  permissions: PermissionResponse[];
  effective_codes: string[];
  sod_warnings: string[];
}

export interface EndpointPermissionMappingResponse {
  endpoint: string;
  method: string;
  permission: string;
  required_permission: string;
  phase: string;
}

export const permissionsApi = {
  listPermissions: async (category?: string): Promise<PermissionResponse[]> => {
    const url = category
      ? `/api/logistics/permissions?category=${category}`
      : '/api/logistics/permissions';
    return apiFetch<PermissionResponse[]>(url);
  },

  getPermission: async (id: string): Promise<PermissionResponse> => {
    return apiFetch<PermissionResponse>(`/api/logistics/permissions/${id}`);
  },

  getRoleEffectivePermissions: async (
    roleId: string
  ): Promise<RoleEffectivePermissionsResponse> => {
    return apiFetch<RoleEffectivePermissionsResponse>(
      `/api/logistics/roles/${roleId}/permissions`
    );
  },

  getRolePermissions: async (
    roleId: string
  ): Promise<RoleEffectivePermissionsResponse> => {
    return apiFetch<RoleEffectivePermissionsResponse>(
      `/api/logistics/roles/${roleId}/permissions`
    );
  },

  assignRolePermissions: async (
    roleId: string,
    data: string[] | { permission_codes: string[] }
  ): Promise<RoleEffectivePermissionsResponse> => {
    const codes = Array.isArray(data) ? data : data.permission_codes;
    return apiFetch<RoleEffectivePermissionsResponse>(
      `/api/logistics/roles/${roleId}/permissions`,
      {
        method: 'PUT',
        body: JSON.stringify({ permission_codes: codes }),
      }
    );
  },

  getEndpointMatrix: async (): Promise<EndpointPermissionMappingResponse[]> => {
    const data = await apiFetch<Array<{ endpoint: string; method: string; permission: string; phase: string }>>(
      '/api/logistics/permissions/endpoint-matrix'
    );
    return data.map((item) => ({
      ...item,
      required_permission: item.permission,
    }));
  },
};
