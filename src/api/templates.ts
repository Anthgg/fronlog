import { apiFetch, API_BASE_URL, ApiError } from './client';

export interface TemplateManifest {
  template_key: string;
  family: string;
  version: string;
  title: string;
  description: string;
  page_size: string;
  orientation: string;
  supported_renderer: string;
  required_context_fields: string[];
  supported_statuses: string[];
  created_at: string;
}

export async function fetchTemplates(family?: string): Promise<TemplateManifest[]> {
  const query = family ? `?family=${encodeURIComponent(family)}` : '';
  return apiFetch<TemplateManifest[]>(`/api/logistics/document-renderer/templates${query}`);
}

export async function fetchTemplateDetail(templateKey: string): Promise<TemplateManifest> {
  return apiFetch<TemplateManifest>(`/api/logistics/document-renderer/templates/${encodeURIComponent(templateKey)}`);
}

export async function fetchSamplePdfBlob(options?: {
  rowsCount?: number;
  statusCode?: string;
}): Promise<string> {
  const params = new URLSearchParams();
  params.append('format', 'pdf');
  if (options?.rowsCount) params.append('rows_count', options.rowsCount.toString());
  if (options?.statusCode) params.append('status_code', options.statusCode);

  const res = await fetch(`${API_BASE_URL}/api/logistics/document-renderer/sample?${params.toString()}`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    let errorMsg = 'Error al renderizar el documento PDF.';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Non-JSON
    }
    throw new ApiError(res.status, errorMsg, 'PDF_RENDER_FAILED');
  }

  const blob = await res.blob();
  return window.URL.createObjectURL(blob);
}

export async function fetchPurchasingSamplePdfBlob(
  docCode: string,
  options?: {
    scenario?: string;
    statusCode?: string;
  }
): Promise<string> {
  const params = new URLSearchParams();
  params.append('format', 'pdf');
  if (options?.scenario) params.append('scenario', options.scenario);
  if (options?.statusCode) params.append('status_code', options.statusCode);

  const res = await fetch(
    `${API_BASE_URL}/api/logistics/document-renderer/purchasing/${encodeURIComponent(docCode)}/sample?${params.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!res.ok) {
    let errorMsg = 'Error al renderizar la muestra de compras en PDF.';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Non-JSON
    }
    throw new ApiError(res.status, errorMsg, 'PDF_RENDER_FAILED');
  }

  const blob = await res.blob();
  return window.URL.createObjectURL(blob);
}

export async function downloadPurchasingSamplePdf(
  docCode: string,
  options?: {
    scenario?: string;
    statusCode?: string;
    filename?: string;
  }
): Promise<void> {
  const params = new URLSearchParams();
  params.append('format', 'pdf');
  if (options?.scenario) params.append('scenario', options.scenario);
  if (options?.statusCode) params.append('status_code', options.statusCode);

  const res = await fetch(
    `${API_BASE_URL}/api/logistics/document-renderer/purchasing/${encodeURIComponent(docCode)}/sample?${params.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!res.ok) {
    let errorMsg = 'Error al descargar la muestra de compras.';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Non-JSON
    }
    throw new ApiError(res.status, errorMsg, 'PDF_DOWNLOAD_FAILED');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options?.filename || `muestra_${docCode.toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function fetchReceivingSamplePdfBlob(
  docCode: string,
  options?: {
    scenario?: string;
    statusCode?: string;
  }
): Promise<string> {
  const params = new URLSearchParams();
  params.append('format', 'pdf');
  if (options?.scenario) params.append('scenario', options.scenario);
  if (options?.statusCode) params.append('status_code', options.statusCode);

  const res = await fetch(
    `${API_BASE_URL}/api/logistics/document-renderer/receiving/${encodeURIComponent(docCode)}/sample?${params.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!res.ok) {
    let errorMsg = 'Error al renderizar la muestra de recepción en PDF.';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Non-JSON
    }
    throw new ApiError(res.status, errorMsg, 'PDF_RENDER_FAILED');
  }

  const blob = await res.blob();
  return window.URL.createObjectURL(blob);
}

export async function downloadReceivingSamplePdf(
  docCode: string,
  options?: {
    scenario?: string;
    statusCode?: string;
    filename?: string;
  }
): Promise<void> {
  const params = new URLSearchParams();
  params.append('format', 'pdf');
  if (options?.scenario) params.append('scenario', options.scenario);
  if (options?.statusCode) params.append('status_code', options.statusCode);

  const res = await fetch(
    `${API_BASE_URL}/api/logistics/document-renderer/receiving/${encodeURIComponent(docCode)}/sample?${params.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!res.ok) {
    let errorMsg = 'Error al descargar la muestra de recepción.';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Non-JSON
    }
    throw new ApiError(res.status, errorMsg, 'PDF_DOWNLOAD_FAILED');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options?.filename || `muestra_${docCode.toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function downloadSamplePdf(options?: {
  rowsCount?: number;
  statusCode?: string;
  filename?: string;
}): Promise<void> {
  const params = new URLSearchParams();
  params.append('format', 'pdf');
  if (options?.rowsCount) params.append('rows_count', options.rowsCount.toString());
  if (options?.statusCode) params.append('status_code', options.statusCode);

  const res = await fetch(`${API_BASE_URL}/api/logistics/document-renderer/sample?${params.toString()}`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    let errorMsg = 'Error al descargar el documento PDF.';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Non-JSON
    }
    throw new ApiError(res.status, errorMsg, 'PDF_DOWNLOAD_FAILED');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options?.filename || 'documento_muestra.pdf';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function fetchInventorySamplePdfBlob(
  docCode: string,
  options?: {
    scenario?: string;
    statusCode?: string;
  }
): Promise<string> {
  const params = new URLSearchParams();
  params.append('format', 'pdf');
  if (options?.scenario) params.append('scenario', options.scenario);
  if (options?.statusCode) params.append('status_code', options.statusCode);

  const res = await fetch(
    `${API_BASE_URL}/api/logistics/document-renderer/inventory/${encodeURIComponent(docCode)}/sample?${params.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!res.ok) {
    let errorMsg = 'Error al renderizar la muestra de inventario en PDF.';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Non-JSON
    }
    throw new ApiError(res.status, errorMsg, 'PDF_RENDER_FAILED');
  }

  const blob = await res.blob();
  return window.URL.createObjectURL(blob);
}

export async function downloadInventorySamplePdf(
  docCode: string,
  options?: {
    scenario?: string;
    statusCode?: string;
    filename?: string;
  }
): Promise<void> {
  const params = new URLSearchParams();
  params.append('format', 'pdf');
  if (options?.scenario) params.append('scenario', options.scenario);
  if (options?.statusCode) params.append('status_code', options.statusCode);

  const res = await fetch(
    `${API_BASE_URL}/api/logistics/document-renderer/inventory/${encodeURIComponent(docCode)}/sample?${params.toString()}`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!res.ok) {
    let errorMsg = 'Error al descargar la muestra de inventario.';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {
      // Non-JSON
    }
    throw new ApiError(res.status, errorMsg, 'PDF_DOWNLOAD_FAILED');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options?.filename || `muestra_${docCode.toLowerCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
