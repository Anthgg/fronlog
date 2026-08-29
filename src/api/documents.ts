import { apiFetch } from "./client";

export interface DocumentFamily {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentRetentionPolicy {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  retention_days?: number | null;
  retain_forever: boolean;
  legal_hold_supported: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: string;
  required: boolean;
  description?: string | null;
  options?: string[] | null;
}

export interface EmissionRules {
  requires_organization: boolean;
  requires_branch: boolean;
  requires_warehouse: boolean;
  requires_approval: boolean;
  requires_reason: boolean;
  requires_related_resource: boolean;
  requires_attachments: boolean;
  requires_step_up: boolean;
  preserve_external_number: boolean;
  future_numbering_policy: string;
}

export interface DocumentTypeVersion {
  id: string;
  document_type_id: string;
  version_number: number;
  schema_definition: FieldDefinition[];
  emission_rules: EmissionRules;
  status_definition: string[];
  template_key?: string | null;
  retention_policy_id: string;
  read_permission: string;
  emit_permission: string;
  download_permission: string;
  reprint_permission: string;
  void_permission: string;
  effective_from: string;
  effective_to?: string | null;
  is_current: boolean;
  created_at: string;
  created_by_user_id?: string | null;
}

export interface DocumentType {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  family_id: string;
  family_name?: string | null;
  document_scope: "INTERNAL" | "EXTERNAL";
  is_active: boolean;
  phase_owner: string;
  current_version_number?: number | null;
  current_template_key?: string | null;
  retention_policy_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentTypeDetail extends DocumentType {
  current_version?: DocumentTypeVersion | null;
  versions: DocumentTypeVersion[];
}

export interface CreateDocumentTypeVersionPayload {
  schema_definition: FieldDefinition[];
  emission_rules: Partial<EmissionRules>;
  status_definition: string[];
  template_key?: string | null;
  retention_policy_id: string;
  read_permission?: string;
  emit_permission?: string;
  download_permission?: string;
  reprint_permission?: string;
  void_permission?: string;
}

export interface CreateDocumentTypePayload {
  code: string;
  name: string;
  description?: string;
  family_id: string;
  document_scope: "INTERNAL" | "EXTERNAL";
  phase_owner?: string;
  is_active?: boolean;
  initial_version?: CreateDocumentTypeVersionPayload;
}

export interface UpdateDocumentTypePayload {
  name?: string;
  description?: string;
  is_active?: boolean;
  phase_owner?: string;
}

export async function getDocumentFamilies(activeOnly = false): Promise<DocumentFamily[]> {
  return apiFetch<DocumentFamily[]>(`/api/logistics/document-families?active_only=${activeOnly}`);
}

export async function getDocumentRetentionPolicies(activeOnly = false): Promise<DocumentRetentionPolicy[]> {
  return apiFetch<DocumentRetentionPolicy[]>(`/api/logistics/document-retention-policies?active_only=${activeOnly}`);
}

export async function getDocumentTypes(
  familyId?: string,
  scope?: string,
  activeOnly = false
): Promise<DocumentType[]> {
  const params = new URLSearchParams();
  if (familyId) params.set("family_id", familyId);
  if (scope) params.set("scope", scope);
  if (activeOnly) params.set("active_only", "true");

  const qs = params.toString();
  return apiFetch<DocumentType[]>(`/api/logistics/document-types${qs ? `?${qs}` : ""}`);
}

export async function getDocumentTypeDetail(id: string): Promise<DocumentTypeDetail> {
  return apiFetch<DocumentTypeDetail>(`/api/logistics/document-types/${id}`);
}

export async function getDocumentTypeVersions(id: string): Promise<DocumentTypeVersion[]> {
  return apiFetch<DocumentTypeVersion[]>(`/api/logistics/document-types/${id}/versions`);
}

export async function createDocumentType(
  payload: CreateDocumentTypePayload,
  stepUpGrant?: string
): Promise<DocumentTypeDetail> {
  const headers: Record<string, string> = {};
  if (stepUpGrant) {
    headers["X-Step-Up-Grant"] = stepUpGrant;
  }
  return apiFetch<DocumentTypeDetail>("/api/logistics/document-types", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function updateDocumentType(
  id: string,
  payload: UpdateDocumentTypePayload,
  stepUpGrant?: string
): Promise<DocumentTypeDetail> {
  const headers: Record<string, string> = {};
  if (stepUpGrant) {
    headers["X-Step-Up-Grant"] = stepUpGrant;
  }
  return apiFetch<DocumentTypeDetail>(`/api/logistics/document-types/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
}

export async function createDocumentTypeVersion(
  typeId: string,
  payload: CreateDocumentTypeVersionPayload,
  stepUpGrant?: string
): Promise<DocumentTypeVersion> {
  const headers: Record<string, string> = {};
  if (stepUpGrant) {
    headers["X-Step-Up-Grant"] = stepUpGrant;
  }
  return apiFetch<DocumentTypeVersion>(`/api/logistics/document-types/${typeId}/versions`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}
