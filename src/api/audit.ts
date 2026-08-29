import { apiFetch, API_BASE_URL } from './client';

export interface AuditEventItem {
  id: string;
  occurred_at: string;
  actor_type: string;
  actor_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  resource_type: string;
  resource_id: string | null;
  action: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  reason: string | null;
  correlation_id: string | null;
  is_test_data: boolean;
}

export type AuditEvent = AuditEventItem;

export interface AuditEventDetail extends AuditEventItem {
  user_agent: string | null;
  organization_id: string | null;
  branch_id: string | null;
  warehouse_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  request_id: string | null;
}

export interface AuditListResponse {
  total: number;
  limit: number;
  offset: number;
  items: AuditEventItem[];
}

export interface AuditQueryParams {
  date_from?: string;
  date_to?: string;
  actor_type?: string;
  actor_id?: string;
  organization_id?: string;
  branch_id?: string;
  warehouse_id?: string;
  resource_type?: string;
  resource_id?: string;
  action?: string;
  result?: string;
  correlation_id?: string;
  is_test_data?: boolean;
  limit?: number;
  offset?: number;
}

export type AuditFilters = AuditQueryParams;

export const auditApi = {
  listAuditEvents: async (params: AuditQueryParams = {}): Promise<AuditListResponse> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryStr = searchParams.toString();
    const url = `/api/logistics/audit-events${queryStr ? `?${queryStr}` : ''}`;
    return apiFetch<AuditListResponse>(url);
  },

  getAuditEventDetail: async (eventId: string): Promise<AuditEventDetail> => {
    return apiFetch<AuditEventDetail>(`/api/logistics/audit-events/${eventId}`);
  },

  downloadCsv: async (params: AuditQueryParams = {}): Promise<void> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && key !== 'limit' && key !== 'offset') {
        searchParams.append(key, String(value));
      }
    });

    const queryStr = searchParams.toString();
    const url = `${API_BASE_URL}/api/logistics/audit-events/export${queryStr ? `?${queryStr}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error(`Export failed: ${res.status} ${res.statusText}`);
    }

    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `audit_trail_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export const listAuditEvents = auditApi.listAuditEvents;
export const getAuditEvent = auditApi.getAuditEventDetail;
export const downloadAuditCsv = auditApi.downloadCsv;
