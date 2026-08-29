import { apiFetch, API_BASE_URL, ApiError } from './client';

export interface DocumentSeriesResponse {
  id: string;
  organization_id: string;
  document_type_id: string;
  document_type_code: string | null;
  document_type_name: string | null;
  branch_id: string;
  branch_code: string | null;
  branch_name: string | null;
  period_year: number;
  series_prefix: string;
  next_correlative: number;
  correlative_width: number;
  is_active: boolean;
  is_test_data: boolean;
  reserved_count: number;
  voided_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentSeriesCreate {
  document_type_id: string;
  branch_id: string;
  period_year: number;
}

export interface DocumentSeriesReservationCreate {
  quantity: number;
  reason?: string;
}

export interface DocumentSeriesReservationResponse {
  id: string;
  series_id: string;
  start_correlative: number;
  end_correlative: number;
  quantity: number;
  first_display_code: string;
  last_display_code: string;
  reserved_by_user_id: string;
  reserved_by_name?: string | null;
  reserved_at: string;
  reason?: string | null;
  correlation_id?: string | null;
}

export interface DocumentSeriesNumberResponse {
  id: string;
  series_id: string;
  reservation_id: string;
  correlative: number;
  display_code: string;
  status: 'RESERVED' | 'VOIDED' | string;
  reserved_at: string;
  voided_at?: string | null;
  voided_by_user_id?: string | null;
  voided_by_name?: string | null;
  void_reason?: string | null;
}

export interface VoidDocumentNumberRequest {
  reason: string;
}

export interface DocumentSeriesDetailResponse extends DocumentSeriesResponse {
  reservations: DocumentSeriesReservationResponse[];
}

export async function fetchDocumentSeries(filters?: {
  document_type_id?: string;
  branch_id?: string;
  period_year?: number;
  is_active?: boolean;
}): Promise<DocumentSeriesResponse[]> {
  const params = new URLSearchParams();
  if (filters?.document_type_id) params.append('document_type_id', filters.document_type_id);
  if (filters?.branch_id) params.append('branch_id', filters.branch_id);
  if (filters?.period_year) params.append('period_year', filters.period_year.toString());
  if (filters?.is_active !== undefined) params.append('is_active', String(filters.is_active));

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<DocumentSeriesResponse[]>(`/api/logistics/document-series${query}`);
}

export async function createDocumentSeries(
  data: DocumentSeriesCreate
): Promise<DocumentSeriesResponse> {
  return apiFetch<DocumentSeriesResponse>('/api/logistics/document-series', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchDocumentSeriesDetail(
  id: string
): Promise<DocumentSeriesDetailResponse> {
  return apiFetch<DocumentSeriesDetailResponse>(`/api/logistics/document-series/${id}`);
}

export async function reserveDocumentCorrelatives(
  seriesId: string,
  data: DocumentSeriesReservationCreate
): Promise<DocumentSeriesReservationResponse> {
  return apiFetch<DocumentSeriesReservationResponse>(`/api/logistics/document-series/${seriesId}/reservations`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchSeriesNumbers(
  seriesId: string,
  filters?: {
    status?: string;
    reservation_id?: string;
    from_correlative?: number;
    to_correlative?: number;
  }
): Promise<DocumentSeriesNumberResponse[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.reservation_id) params.append('reservation_id', filters.reservation_id);
  if (filters?.from_correlative) params.append('from_correlative', filters.from_correlative.toString());
  if (filters?.to_correlative) params.append('to_correlative', filters.to_correlative.toString());

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch<DocumentSeriesNumberResponse[]>(`/api/logistics/document-series/${seriesId}/numbers${query}`);
}

export async function voidDocumentNumber(
  numberId: string,
  data: VoidDocumentNumberRequest
): Promise<DocumentSeriesNumberResponse> {
  return apiFetch<DocumentSeriesNumberResponse>(`/api/logistics/document-series/numbers/${numberId}/void`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function downloadReservationBookletCsv(reservationId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/logistics/document-series/reservations/${reservationId}/booklet?format=csv`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    let errorMsg = 'Error al descargar talonario.';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Non-json
    }
    throw new ApiError(res.status, errorMsg, 'BOOKLET_DOWNLOAD_FAILED');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `talonario_reserva_${reservationId}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
