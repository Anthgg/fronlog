import { API_BASE_URL } from './client';

export interface AuditEvent {
  id: string;
  occurred_at: string;
  actor_type: string;
  actor_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  organization_id: string | null;
  branch_id: string | null;
  warehouse_id: string | null;
  resource_type: string;
  resource_id: string | null;
  action: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED' | string;
  reason: string | null;
  correlation_id: string;
  request_id: string | null;
  is_test_data: boolean;
}

export interface AuditEventDetail extends AuditEvent {
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditListResponse {
  total: number;
  limit: number;
  offset: number;
  items: AuditEvent[];
}

export interface AuditFilters {
  date_from?: string;
  date_to?: string;
  actor_type?: string;
  resource_type?: string;
  action?: string;
  result?: string;
  correlation_id?: string;
  is_test_data?: boolean;
  limit?: number;
  offset?: number;
}

function buildQueryParams(filters?: AuditFilters): string {
  if (!filters) return '';
  const params = new URLSearchParams();
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.actor_type) params.append('actor_type', filters.actor_type);
  if (filters.resource_type) params.append('resource_type', filters.resource_type);
  if (filters.action) params.append('action', filters.action);
  if (filters.result) params.append('result', filters.result);
  if (filters.correlation_id) params.append('correlation_id', filters.correlation_id);
  if (filters.is_test_data !== undefined) params.append('is_test_data', String(filters.is_test_data));
  if (filters.limit !== undefined) params.append('limit', String(filters.limit));
  if (filters.offset !== undefined) params.append('offset', String(filters.offset));
  const queryStr = params.toString();
  return queryStr ? `?${queryStr}` : '';
}

export async function listAuditEvents(filters?: AuditFilters): Promise<AuditListResponse> {
  const query = buildQueryParams(filters);
  const response = await fetch(`${API_BASE_URL}/api/logistics/audit-events${query}`);
  if (!response.ok) {
    throw new Error(`Error al consultar auditoría: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getAuditEvent(id: string): Promise<AuditEventDetail> {
  const response = await fetch(`${API_BASE_URL}/api/logistics/audit-events/${id}`);
  if (!response.ok) {
    throw new Error(`Error al obtener detalle de evento: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function getAuditCsvExportUrl(filters?: AuditFilters): string {
  const query = buildQueryParams(filters);
  return `${API_BASE_URL}/api/logistics/audit-events/export${query}`;
}

export async function downloadAuditCsv(filters?: AuditFilters): Promise<void> {
  const query = buildQueryParams(filters);
  const response = await fetch(`${API_BASE_URL}/api/logistics/audit-events/export${query}`);
  if (!response.ok) {
    throw new Error(`Error al descargar CSV de auditoría: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
