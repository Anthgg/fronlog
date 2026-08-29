import { apiFetch } from './client';

export interface NumberingStandardSegment {
  key: string;
  name: string;
  description: string;
  example: string;
  source: string;
}

export interface NumberingStandardSpec {
  standard: string;
  pattern: string;
  correlative_width: number;
  reuse_policy: string;
  uniqueness_scope: string;
  allocation_phase: string;
  official_number_preservation: boolean;
  segments: NumberingStandardSegment[];
  examples: string[];
}

export interface StructuredDocumentIdentity {
  organization_id: string;
  document_type_id: string;
  document_type_code: string;
  branch_id: string;
  branch_code: string;
  period_year: number;
  correlative: number;
  display_code: string;
}

export interface DocumentNumberingPreviewRequest {
  document_type_id: string;
  branch_id: string;
  period_year?: number;
  sample_correlative: number;
}

export interface DocumentNumberingPreviewResponse {
  preview: string;
  format_pattern: string;
  structured_identity: StructuredDocumentIdentity;
  reserved: boolean;
  allocated: boolean;
  message: string;
}

export const getDocumentNumberingStandard = async (): Promise<NumberingStandardSpec> => {
  return apiFetch<NumberingStandardSpec>('/api/logistics/document-numbering/standard');
};

export const previewDocumentNumbering = async (
  payload: DocumentNumberingPreviewRequest
): Promise<DocumentNumberingPreviewResponse> => {
  return apiFetch<DocumentNumberingPreviewResponse>('/api/logistics/document-numbering/preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
