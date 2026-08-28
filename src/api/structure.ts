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

export interface WarehouseHierarchyItem {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  is_test_data: boolean;
  location?: OperationalLocation | null;
}

export interface BranchHierarchyItem {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  is_test_data: boolean;
  location?: OperationalLocation | null;
  warehouses: WarehouseHierarchyItem[];
}

export interface OrganizationHierarchyItem {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  is_test_data: boolean;
  branches: BranchHierarchyItem[];
}

export interface StructureResponse {
  organizations: OrganizationHierarchyItem[];
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errBody: ApiErrorResponse;
    try {
      errBody = await res.json();
    } catch {
      errBody = {
        code: `HTTP_${res.status}`,
        message: res.statusText || 'Error en la solicitud al servidor',
      };
    }
    throw errBody;
  }
  if (res.status === 204) {
    return {} as T;
  }
  return res.json();
}

export const structureApi = {
  getStructure: async (): Promise<StructureResponse> => {
    const res = await fetch(`${API_URL}/api/logistics/structure`);
    return handleResponse<StructureResponse>(res);
  },

  listOrganizations: async (): Promise<Organization[]> => {
    const res = await fetch(`${API_URL}/api/logistics/organizations`);
    return handleResponse<Organization[]>(res);
  },

  createOrganization: async (data: {
    code: string;
    name: string;
    is_active?: boolean;
    is_test_data?: boolean;
  }): Promise<Organization> => {
    const res = await fetch(`${API_URL}/api/logistics/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Organization>(res);
  },

  updateOrganization: async (
    id: string,
    data: { name?: string; is_active?: boolean }
  ): Promise<Organization> => {
    const res = await fetch(`${API_URL}/api/logistics/organizations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Organization>(res);
  },

  deleteOrganization: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/logistics/organizations/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  listBranches: async (orgId: string): Promise<Branch[]> => {
    const res = await fetch(`${API_URL}/api/logistics/organizations/${orgId}/branches`);
    return handleResponse<Branch[]>(res);
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
    const res = await fetch(`${API_URL}/api/logistics/organizations/${orgId}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Branch>(res);
  },

  updateBranch: async (
    branchId: string,
    data: { name?: string; is_active?: boolean; location?: OperationalLocation }
  ): Promise<Branch> => {
    const res = await fetch(`${API_URL}/api/logistics/branches/${branchId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Branch>(res);
  },

  deleteBranch: async (branchId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/logistics/branches/${branchId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  listWarehouses: async (branchId: string): Promise<Warehouse[]> => {
    const res = await fetch(`${API_URL}/api/logistics/branches/${branchId}/warehouses`);
    return handleResponse<Warehouse[]>(res);
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
    const res = await fetch(`${API_URL}/api/logistics/branches/${branchId}/warehouses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Warehouse>(res);
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
    const res = await fetch(`${API_URL}/api/logistics/warehouses/${warehouseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Warehouse>(res);
  },

  deleteWarehouse: async (warehouseId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/logistics/warehouses/${warehouseId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },
};
