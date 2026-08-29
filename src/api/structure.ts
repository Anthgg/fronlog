import { apiFetch } from './client';

export interface OperationalLocation {
  id?: string;
  label: string;
  address_line1: string;
  address_line2?: string | null;
  district?: string | null;
  province?: string | null;
  department?: string | null;
  country_code: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Organization {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  is_test_data: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  location_id: string;
  location?: OperationalLocation | null;
  is_active: boolean;
  is_test_data: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  organization_id: string;
  branch_id: string;
  code: string;
  name: string;
  location_id: string;
  location?: OperationalLocation | null;
  is_active: boolean;
  is_test_data: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchTreeItem {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  is_test_data: boolean;
  location: OperationalLocation | null;
  warehouses: Warehouse[];
}

export interface OrganizationTreeItem {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  is_test_data: boolean;
  branches: BranchTreeItem[];
}

export type OrganizationHierarchyItem = OrganizationTreeItem;
export type BranchHierarchyItem = BranchTreeItem;
export type WarehouseHierarchyItem = Warehouse;

export interface StructureResponse {
  organizations: OrganizationTreeItem[];
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const structureApi = {
  getStructure: async (): Promise<StructureResponse> => {
    return apiFetch<StructureResponse>('/api/logistics/structure');
  },

  listOrganizations: async (): Promise<Organization[]> => {
    return apiFetch<Organization[]>('/api/logistics/organizations');
  },

  createOrganization: async (data: {
    code: string;
    name: string;
    is_active?: boolean;
    is_test_data?: boolean;
  }): Promise<Organization> => {
    return apiFetch<Organization>('/api/logistics/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateOrganization: async (
    id: string,
    data: { name?: string; is_active?: boolean }
  ): Promise<Organization> => {
    return apiFetch<Organization>(`/api/logistics/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteOrganization: async (id: string): Promise<void> => {
    return apiFetch<void>(`/api/logistics/organizations/${id}`, {
      method: 'DELETE',
    });
  },

  listBranches: async (orgId: string): Promise<Branch[]> => {
    return apiFetch<Branch[]>(`/api/logistics/organizations/${orgId}/branches`);
  },

  createBranch: async (
    orgId: string,
    data: {
      code: string;
      name: string;
      location: OperationalLocation;
      is_active?: boolean;
      is_test_data?: boolean;
    }
  ): Promise<Branch> => {
    return apiFetch<Branch>(`/api/logistics/organizations/${orgId}/branches`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateBranch: async (
    branchId: string,
    data: { name?: string; is_active?: boolean; location?: OperationalLocation }
  ): Promise<Branch> => {
    return apiFetch<Branch>(`/api/logistics/branches/${branchId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteBranch: async (branchId: string): Promise<void> => {
    return apiFetch<void>(`/api/logistics/branches/${branchId}`, {
      method: 'DELETE',
    });
  },

  listWarehouses: async (branchId: string): Promise<Warehouse[]> => {
    return apiFetch<Warehouse[]>(`/api/logistics/branches/${branchId}/warehouses`);
  },

  createWarehouse: async (
    branchId: string,
    data: {
      code: string;
      name: string;
      use_branch_location: boolean;
      custom_location?: OperationalLocation;
      is_active?: boolean;
      is_test_data?: boolean;
    }
  ): Promise<Warehouse> => {
    return apiFetch<Warehouse>(`/api/logistics/branches/${branchId}/warehouses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateWarehouse: async (
    warehouseId: string,
    data: {
      name?: string;
      is_active?: boolean;
      use_branch_location?: boolean;
      custom_location?: OperationalLocation;
    }
  ): Promise<Warehouse> => {
    return apiFetch<Warehouse>(`/api/logistics/warehouses/${warehouseId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteWarehouse: async (warehouseId: string): Promise<void> => {
    return apiFetch<void>(`/api/logistics/warehouses/${warehouseId}`, {
      method: 'DELETE',
    });
  },
};
