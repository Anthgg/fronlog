import React, { useEffect, useState, useMemo } from "react";
import {
  DocumentFamily,
  DocumentRetentionPolicy,
  DocumentType,
  DocumentTypeDetail,
  DocumentTypeVersion,
  FieldDefinition,
  CreateDocumentTypeVersionPayload,
  getDocumentFamilies,
  getDocumentRetentionPolicies,
  getDocumentTypes,
  getDocumentTypeDetail,
  createDocumentTypeVersion,
} from "../api/documents";
import { ApiError } from "../api/client";
import { StepUpDialog, StepUpChallengeInfo } from "../components/StepUpDialog";
import { useAuth } from "../context/AuthContext";

export const DocumentCatalogPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("document_catalog.manage");

  const [families, setFamilies] = useState<DocumentFamily[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<DocumentRetentionPolicy[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>("ALL");
  const [selectedScope, setSelectedScope] = useState<"ALL" | "INTERNAL" | "EXTERNAL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail Modal & Tabs
  const [selectedDocType, setSelectedDocType] = useState<DocumentTypeDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "fields" | "states" | "history" | "new_version">("general");
  const [inspectingVersion, setInspectingVersion] = useState<DocumentTypeVersion | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // New Version Form State
  const [newFields, setNewFields] = useState<FieldDefinition[]>([]);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newRetentionId, setNewRetentionId] = useState("");
  const [newTemplateKey, setNewTemplateKey] = useState("");
  const [isPublishingVersion, setIsPublishingVersion] = useState(false);

  // Step-Up Dialog State
  const [stepUpChallenge, setStepUpChallenge] = useState<StepUpChallengeInfo | null>(null);
  const [isStepUpOpen, setIsStepUpOpen] = useState(false);
  const [pendingPublishPayload, setPendingPublishPayload] = useState<CreateDocumentTypeVersionPayload | null>(null);

  const loadCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const [fams, rets, docs] = await Promise.all([
        getDocumentFamilies(),
        getDocumentRetentionPolicies(),
        getDocumentTypes(),
      ]);
      setFamilies(fams);
      setRetentionPolicies(rets);
      setDocumentTypes(docs);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || "Error al cargar el catálogo documental.");
      } else {
        setError("Error de conexión al cargar datos.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const openDetail = async (typeId: string) => {
    setIsDetailLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const detail = await getDocumentTypeDetail(typeId);
      setSelectedDocType(detail);
      setInspectingVersion(detail.current_version || null);
      setActiveTab("general");

      // Initialize new version form with current definition
      if (detail.current_version) {
        setNewFields([...detail.current_version.schema_definition]);
        setNewRetentionId(detail.current_version.retention_policy_id);
        setNewTemplateKey(detail.current_version.template_key || "");
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Error al cargar el detalle del tipo documental.");
      }
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedDocType(null);
    setInspectingVersion(null);
    setSuccessMsg(null);
    setError(null);
  };

  const handleAddField = () => {
    if (!newFieldKey.trim() || !newFieldLabel.trim()) return;
    const cleanKey = newFieldKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (newFields.some((f) => f.key === cleanKey)) {
      alert(`El campo '${cleanKey}' ya existe en la lista.`);
      return;
    }
    setNewFields([
      ...newFields,
      {
        key: cleanKey,
        label: newFieldLabel.trim(),
        type: newFieldType,
        required: newFieldRequired,
      },
    ]);
    setNewFieldKey("");
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldRequired(true);
  };

  const handleRemoveField = (key: string) => {
    setNewFields(newFields.filter((f) => f.key !== key));
  };

  const handlePublishVersion = async (grantId?: string) => {
    if (!selectedDocType) return;
    setIsPublishingVersion(true);
    setError(null);
    setSuccessMsg(null);

    const payload = pendingPublishPayload || {
      schema_definition: newFields,
      emission_rules: selectedDocType.current_version?.emission_rules || {
        requires_organization: true,
        requires_branch: true,
        requires_warehouse: false,
        requires_approval: false,
        requires_step_up: false,
        preserve_external_number: selectedDocType.document_scope === "EXTERNAL",
        future_numbering_policy: selectedDocType.document_scope === "EXTERNAL" ? "EXTERNAL_PRESERVED" : "SYSTEM_INTERNAL",
      },
      status_definition: selectedDocType.current_version?.status_definition || ["DRAFT", "ISSUED", "VOID"],
      template_key: newTemplateKey.trim() || null,
      retention_policy_id: newRetentionId || retentionPolicies[0]?.id,
    };

    try {
      const createdVersion = await createDocumentTypeVersion(selectedDocType.id, payload, grantId);
      setSuccessMsg(`¡Versión v${createdVersion.version_number} publicada exitosamente!`);
      setPendingPublishPayload(null);
      setIsStepUpOpen(false);

      // Refresh detail and catalog
      const updatedDetail = await getDocumentTypeDetail(selectedDocType.id);
      setSelectedDocType(updatedDetail);
      setInspectingVersion(updatedDetail.current_version || null);
      setActiveTab("history");
      loadCatalog();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 428) {
        // Step-Up challenge required
        const challengeId = (err.details?.challenge_id as string) || "";
        const policy = (err.details?.policy as string) || "HIGH_RISK_ACTION";
        setPendingPublishPayload(payload);
        setStepUpChallenge({
          challengeId,
          policy,
          reason: "Publicar nueva versión inmutable en el catálogo documental requiere autenticación reforzada.",
        });
        setIsStepUpOpen(true);
      } else if (err instanceof ApiError) {
        setError(err.message || "Error al publicar la versión.");
      } else {
        setError("Error de conexión.");
      }
    } finally {
      setIsPublishingVersion(false);
    }
  };

  // Filtered Document Types
  const filteredTypes = useMemo(() => {
    return documentTypes.filter((dt) => {
      if (selectedFamilyId !== "ALL" && dt.family_id !== selectedFamilyId) {
        return false;
      }
      if (selectedScope !== "ALL" && dt.document_scope !== selectedScope) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = dt.code.toLowerCase().includes(q);
        const matchesName = dt.name.toLowerCase().includes(q);
        const matchesFamily = (dt.family_name || "").toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesFamily) return false;
      }
      return true;
    });
  }, [documentTypes, selectedFamilyId, selectedScope, searchQuery]);

  // Statistics
  const totalInternal = useMemo(() => documentTypes.filter((d) => d.document_scope === "INTERNAL").length, [documentTypes]);
  const totalExternal = useMemo(() => documentTypes.filter((d) => d.document_scope === "EXTERNAL").length, [documentTypes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <h1 className="text-2xl font-bold text-gray-900">Catálogo Documental Versionado</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Motor Documental (Bloque II) — Especificación canónica de familias, alcances, esquemas, reglas de emisión y versiones inmutables.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCatalog}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🔄</span> Refrescar
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Tipos</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{documentTypes.length}</div>
          <div className="text-xs text-emerald-600 mt-1 font-medium">Catálogo Canónico</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Docs Internos</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{totalInternal}</div>
          <div className="text-xs text-gray-500 mt-1">Numeración propia (F012)</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Docs Externos</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{totalExternal}</div>
          <div className="text-xs text-gray-500 mt-1">Nro de origen preservado</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Familias</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{families.length}</div>
          <div className="text-xs text-gray-500 mt-1">Clasificación canónica</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Retención</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{retentionPolicies.length}</div>
          <div className="text-xs text-gray-500 mt-1">Políticas de custodia</div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">×</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
        {/* Family Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedFamilyId("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedFamilyId === "ALL"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Todas las Familias ({documentTypes.length})
          </button>
          {families.map((f) => {
            const count = documentTypes.filter((d) => d.family_id === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFamilyId(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedFamilyId === f.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Scope & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-gray-500 uppercase">Alcance:</span>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setSelectedScope("ALL")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedScope === "ALL" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Todos ({documentTypes.length})
              </button>
              <button
                onClick={() => setSelectedScope("INTERNAL")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedScope === "INTERNAL" ? "bg-white text-blue-700 shadow-xs font-semibold" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Internos ({totalInternal})
              </button>
              <button
                onClick={() => setSelectedScope("EXTERNAL")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedScope === "EXTERNAL" ? "bg-white text-purple-700 shadow-xs font-semibold" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Externos ({totalExternal})
              </button>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código (ej: PO, GRN) o nombre..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <div className="animate-spin text-2xl">⏳</div>
            <p className="text-sm">Cargando catálogo documental versionado...</p>
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-2">
            <div className="text-3xl">📭</div>
            <p className="text-base font-semibold text-gray-700">No se encontraron tipos documentales</p>
            <p className="text-xs text-gray-400">Intente modificar los filtros o el término de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3">Código</th>
                  <th className="px-5 py-3">Nombre del Tipo</th>
                  <th className="px-5 py-3">Familia</th>
                  <th className="px-5 py-3">Alcance</th>
                  <th className="px-5 py-3">Versión</th>
                  <th className="px-5 py-3">Retención</th>
                  <th className="px-5 py-3">Plantilla</th>
                  <th className="px-5 py-3">Fase</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTypes.map((dt) => (
                  <tr key={dt.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-gray-900">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">
                        {dt.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      <div>{dt.name}</div>
                      {dt.description && <div className="text-xs text-gray-400 truncate max-w-xs">{dt.description}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600 font-medium">
                      {dt.family_name || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          dt.document_scope === "INTERNAL"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {dt.document_scope === "INTERNAL" ? "INTERNO" : "EXTERNO"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        v{dt.current_version_number || 1}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-600">
                      {dt.retention_policy_name || "Estándar"}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      {dt.current_template_key ? (
                        <span className="text-gray-700 font-mono text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">
                          {dt.current_template_key}
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                          Pendiente F014
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                      {dt.phase_owner}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openDetail(dt.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Ver Detalle & Versiones ➔
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Modal / Drawer */}
      {selectedDocType && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span className="font-mono text-base font-bold bg-blue-600 text-white px-2.5 py-1 rounded-lg">
                  {selectedDocType.code}
                </span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedDocType.name}</h2>
                  <p className="text-xs text-gray-500">{selectedDocType.description || "Sin descripción adicional"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedDocType.document_scope === "INTERNAL"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {selectedDocType.document_scope === "INTERNAL" ? "INTERNO" : "EXTERNO"}
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
                  v{selectedDocType.current_version_number || 1}
                </span>
                <button
                  onClick={closeDetail}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-100 bg-white px-6">
              <button
                onClick={() => setActiveTab("general")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "general"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                📋 Especificación & Reglas
              </button>
              <button
                onClick={() => setActiveTab("fields")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "fields"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                📝 Campos Requeridos ({inspectingVersion?.schema_definition?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("states")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "states"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                🔄 Estados Permitidos ({inspectingVersion?.status_definition?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === "history"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                🕰️ Historial Inmutable ({selectedDocType.versions?.length || 0})
              </button>
              {canManage && (
                <button
                  onClick={() => setActiveTab("new_version")}
                  className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                    activeTab === "new_version"
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-emerald-600 hover:text-emerald-700"
                  }`}
                >
                  ➕ Publicar Nueva Versión
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {isDetailLoading ? (
                <div className="py-12 text-center text-gray-500">Cargando especificación...</div>
              ) : (
                <>
                  {/* TAB 1: General & Rules */}
                  {activeTab === "general" && (
                    <div className="space-y-6">
                      {/* Scope Banner */}
                      <div
                        className={`p-4 rounded-xl border ${
                          selectedDocType.document_scope === "INTERNAL"
                            ? "bg-blue-50 border-blue-200 text-blue-900"
                            : "bg-purple-50 border-purple-200 text-purple-900"
                        }`}
                      >
                        <div className="font-bold text-sm flex items-center gap-2">
                          <span>{selectedDocType.document_scope === "INTERNAL" ? "🏢" : "🌐"}</span>
                          <span>
                            {selectedDocType.document_scope === "INTERNAL"
                              ? "Alcance Documental: INTERNO"
                              : "Alcance Documental: EXTERNO"}
                          </span>
                        </div>
                        <p className="text-xs mt-1 text-gray-600">
                          {selectedDocType.document_scope === "INTERNAL"
                            ? "El documento es generado por el sistema. La política de numeración correlativa 'TIPO-SEDE-AÑO-CORRELATIVO' será asignada formalmente en F012/F013."
                            : "El documento se origina legalmente fuera de la empresa (proveedor, transportista o cliente). Se preserva estrictamente el número correlativo y serie de origen legal (preserve_external_number = true)."}
                        </p>
                      </div>

                      {/* Emission Rules Grid */}
                      <div>
                        <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-3">
                          Reglas Operativas de Emisión
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500">Requiere Organización</span>
                            <div className="font-semibold text-sm mt-0.5 text-gray-900">
                              {inspectingVersion?.emission_rules?.requires_organization ? "✅ Sí" : "❌ No"}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500">Requiere Sede</span>
                            <div className="font-semibold text-sm mt-0.5 text-gray-900">
                              {inspectingVersion?.emission_rules?.requires_branch ? "✅ Sí" : "❌ No"}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500">Requiere Almacén</span>
                            <div className="font-semibold text-sm mt-0.5 text-gray-900">
                              {inspectingVersion?.emission_rules?.requires_warehouse ? "✅ Sí" : "❌ No"}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500">Requiere Aprobación Previa</span>
                            <div className="font-semibold text-sm mt-0.5 text-gray-900">
                              {inspectingVersion?.emission_rules?.requires_approval ? "✅ Sí" : "❌ No"}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500">Requiere Step-Up (MFA)</span>
                            <div className="font-semibold text-sm mt-0.5 text-gray-900">
                              {inspectingVersion?.emission_rules?.requires_step_up ? "🔒 Alta Seguridad" : "🔓 Estándar"}
                            </div>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500">Preserva Nro Externo</span>
                            <div className="font-semibold text-sm mt-0.5 text-gray-900">
                              {inspectingVersion?.emission_rules?.preserve_external_number ? "✅ Sí (Externo)" : "❌ No (Interno)"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Permissions & Retention */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
                            Permisos RBAC Asociados (F006)
                          </h4>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between py-1 border-b border-gray-200/60">
                              <span className="text-gray-500">Lectura:</span>
                              <span className="font-mono text-gray-800">{inspectingVersion?.read_permission || "documents.read"}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/60">
                              <span className="text-gray-500">Emisión:</span>
                              <span className="font-mono text-gray-800">{inspectingVersion?.emit_permission || "documents.emit"}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/60">
                              <span className="text-gray-500">Descarga:</span>
                              <span className="font-mono text-gray-800">{inspectingVersion?.download_permission || "documents.download"}</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-gray-500">Anulación:</span>
                              <span className="font-mono text-gray-800">{inspectingVersion?.void_permission || "documents.void"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
                            Custodia y Plantilla
                          </h4>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between py-1 border-b border-gray-200/60">
                              <span className="text-gray-500">Política de Retención:</span>
                              <span className="font-medium text-gray-900">{selectedDocType.retention_policy_name || "Estándar"}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-gray-200/60">
                              <span className="text-gray-500">Clave de Plantilla:</span>
                              <span className="font-mono text-gray-900">{inspectingVersion?.template_key || "Ninguna"}</span>
                            </div>
                            <div className="flex justify-between py-1">
                              <span className="text-gray-500">Motor de Render:</span>
                              <span className="text-amber-700 font-medium">FUTURE_PHASE_OWNER_F014</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Required Fields */}
                  {activeTab === "fields" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                          Campos Definidos en Versión v{inspectingVersion?.version_number}
                        </h4>
                        {!inspectingVersion?.is_current && (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            👁️ Visualizando snapshot histórico de solo lectura
                          </span>
                        )}
                      </div>

                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-100">
                            <tr>
                              <th className="px-4 py-2.5">Clave (Key)</th>
                              <th className="px-4 py-2.5">Etiqueta (Label)</th>
                              <th className="px-4 py-2.5">Tipo de Dato</th>
                              <th className="px-4 py-2.5">Obligatorio</th>
                              <th className="px-4 py-2.5">Opciones / Descripción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {inspectingVersion?.schema_definition?.map((field, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2.5 font-mono font-bold text-gray-900">{field.key}</td>
                                <td className="px-4 py-2.5 font-medium text-gray-800">{field.label}</td>
                                <td className="px-4 py-2.5">
                                  <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">
                                    {field.type}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5">
                                  {field.required ? (
                                    <span className="text-red-600 font-semibold">Requerido</span>
                                  ) : (
                                    <span className="text-gray-400">Opcional</span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 text-gray-500">
                                  {field.options ? field.options.join(", ") : field.description || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Allowed States */}
                  {activeTab === "states" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                        Ciclo de Vida y Estados Permitidos para este Documento
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {inspectingVersion?.status_definition?.map((st, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-800 flex items-center gap-1.5"
                          >
                            <span>●</span>
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Nota: Las transiciones operativas completas entre estados se aplican en sus fases propietarias respectivas.
                      </p>
                    </div>
                  )}

                  {/* TAB 4: Version History */}
                  {activeTab === "history" && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                        Historial Inmutable de Versiones Publicadas
                      </h4>
                      <div className="border border-gray-100 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-100">
                            <tr>
                              <th className="px-4 py-2.5">Versión</th>
                              <th className="px-4 py-2.5">Vigente Desde</th>
                              <th className="px-4 py-2.5">Vigente Hasta</th>
                              <th className="px-4 py-2.5">Estado</th>
                              <th className="px-4 py-2.5">Plantilla</th>
                              <th className="px-4 py-2.5 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedDocType.versions?.map((v) => (
                              <tr
                                key={v.id}
                                className={`hover:bg-gray-50 transition-colors ${
                                  inspectingVersion?.id === v.id ? "bg-blue-50/50" : ""
                                }`}
                              >
                                <td className="px-4 py-2.5 font-mono font-bold text-gray-900">
                                  v{v.version_number}
                                </td>
                                <td className="px-4 py-2.5 text-gray-600">
                                  {new Date(v.effective_from).toLocaleString()}
                                </td>
                                <td className="px-4 py-2.5 text-gray-600">
                                  {v.effective_to ? new Date(v.effective_to).toLocaleString() : "— (Actual)"}
                                </td>
                                <td className="px-4 py-2.5">
                                  {v.is_current ? (
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded-full">
                                      Vigente
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                      Histórica
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-gray-500">
                                  {v.template_key || "—"}
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <button
                                    onClick={() => {
                                      setInspectingVersion(v);
                                      setActiveTab("fields");
                                    }}
                                    className="text-blue-600 hover:text-blue-800 font-semibold"
                                  >
                                    Ver Snapshot ➔
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: Publish New Version */}
                  {activeTab === "new_version" && canManage && (
                    <div className="space-y-6">
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>🛡️</span> Publicar Versión v{(selectedDocType.current_version_number || 1) + 1}
                        </div>
                        <p className="mt-1">
                          Al publicar una nueva versión, la versión previa quedará archivada de forma inmutable y se cerrará su periodo de vigencia. La nueva versión será la definición activa para futuras emisiones.
                        </p>
                      </div>

                      {/* Required Fields Builder */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-gray-700 tracking-wider">
                          Esquema de Campos Requeridos
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <input
                            type="text"
                            placeholder="Clave (ej: invoice_number)"
                            value={newFieldKey}
                            onChange={(e) => setNewFieldKey(e.target.value)}
                            className="px-3 py-1.5 text-xs border rounded-lg bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Etiqueta (ej: Nro Factura)"
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                            className="px-3 py-1.5 text-xs border rounded-lg bg-white"
                          />
                          <select
                            value={newFieldType}
                            onChange={(e) => setNewFieldType(e.target.value)}
                            className="px-3 py-1.5 text-xs border rounded-lg bg-white"
                          >
                            <option value="text">text (Texto corto)</option>
                            <option value="long_text">long_text (Texto multilínea)</option>
                            <option value="integer">integer (Entero)</option>
                            <option value="decimal">decimal (Decimal / Monto)</option>
                            <option value="date">date (Fecha)</option>
                            <option value="datetime">datetime (Fecha y Hora)</option>
                            <option value="boolean">boolean (Verdadero / Falso)</option>
                            <option value="uuid">uuid (Identificador UUID)</option>
                            <option value="enum">enum (Opciones cerradas)</option>
                            <option value="reference">reference (Referencia cruzada)</option>
                            <option value="file">file (Archivo adjunto)</option>
                          </select>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newFieldRequired}
                                onChange={(e) => setNewFieldRequired(e.target.checked)}
                              />
                              Requerido
                            </label>
                            <button
                              onClick={handleAddField}
                              type="button"
                              className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors ml-auto"
                            >
                              + Añadir
                            </button>
                          </div>
                        </div>

                        {/* Field list */}
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-600 uppercase font-semibold">
                              <tr>
                                <th className="px-3 py-2">Clave</th>
                                <th className="px-3 py-2">Etiqueta</th>
                                <th className="px-3 py-2">Tipo</th>
                                <th className="px-3 py-2">Obligatorio</th>
                                <th className="px-3 py-2 text-right">Quitar</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {newFields.map((f) => (
                                <tr key={f.key}>
                                  <td className="px-3 py-2 font-mono font-bold">{f.key}</td>
                                  <td className="px-3 py-2">{f.label}</td>
                                  <td className="px-3 py-2 font-mono text-gray-500">{f.type}</td>
                                  <td className="px-3 py-2">{f.required ? "Sí" : "No"}</td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      onClick={() => handleRemoveField(f.key)}
                                      className="text-red-500 hover:text-red-700 font-bold"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Template Key & Retention */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            Política de Retención
                          </label>
                          <select
                            value={newRetentionId}
                            onChange={(e) => setNewRetentionId(e.target.value)}
                            className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
                          >
                            {retentionPolicies.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.name} {r.retention_days ? `(${r.retention_days} días)` : "(Permanente)"}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 block mb-1">
                            Clave de Plantilla Futura (F014)
                          </label>
                          <input
                            type="text"
                            value={newTemplateKey}
                            onChange={(e) => setNewTemplateKey(e.target.value)}
                            placeholder="ej: purchase_order_v2"
                            className="w-full px-3 py-2 text-xs border rounded-lg bg-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Publish Button */}
                      <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button
                          onClick={() => handlePublishVersion()}
                          disabled={isPublishingVersion || newFields.length === 0}
                          className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                          {isPublishingVersion ? "Publicando..." : `🚀 Publicar Versión v${(selectedDocType.current_version_number || 1) + 1}`}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step-Up Verification Modal */}
      <StepUpDialog
        isOpen={isStepUpOpen}
        challenge={stepUpChallenge}
        onSuccess={(grantId) => {
          setIsStepUpOpen(false);
          handlePublishVersion(grantId);
        }}
        onCancel={() => {
          setIsStepUpOpen(false);
          setPendingPublishPayload(null);
        }}
      />
    </div>
  );
};
