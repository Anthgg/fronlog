import { apiFetch } from './client';

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

export const rolesApi = {
  listRoles: async (organizationId?: string): Promise<RoleResponse[]> => {
    const url = organizationId
      ? `/api/logistics/roles?organization_id=${organizationId}`
      : '/api/logistics/roles';
    return apiFetch<RoleResponse[]>(url);
  },

  getRole: async (id: string): Promise<RoleResponse> => {
    return apiFetch<RoleResponse>(`/api/logistics/roles/${id}`);
  },

  createRole: async (data: RoleCreate): Promise<RoleResponse> => {
    return apiFetch<RoleResponse>('/api/logistics/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateRole: async (id: string, data: RoleUpdate): Promise<RoleResponse> => {
    return apiFetch<RoleResponse>(`/api/logistics/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteRole: async (id: string): Promise<void> => {
    return apiFetch<void>(`/api/logistics/roles/${id}`, {
      method: 'DELETE',
    });
  },

  getRoleMatrix: async (): Promise<RoleMatrixResponse> => {
    return apiFetch<RoleMatrixResponse>('/api/logistics/roles/matrix');
  },

  getMatrix: async (): Promise<RoleMatrixResponse> => {
    return apiFetch<RoleMatrixResponse>('/api/logistics/roles/matrix');
  },
};
