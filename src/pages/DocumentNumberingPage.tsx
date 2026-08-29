import React, { useState, useEffect } from 'react';
import {
  getDocumentNumberingStandard,
  previewDocumentNumbering,
  NumberingStandardSpec,
  DocumentNumberingPreviewResponse,
} from '../api/numbering';
import { getDocumentTypes, DocumentType } from '../api/documents';
import { structureApi, BranchTreeItem, OrganizationTreeItem } from '../api/structure';

export const DocumentNumberingPage: React.FC = () => {
  const [standard, setStandard] = useState<NumberingStandardSpec | null>(null);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [branches, setBranches] = useState<BranchTreeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [periodYear, setPeriodYear] = useState<number>(new Date().getFullYear());
  const [sampleCorrelative, setSampleCorrelative] = useState<number>(1);
  const [previewResult, setPreviewResult] = useState<DocumentNumberingPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [stdData, typesData, structData] = await Promise.all([
        getDocumentNumberingStandard(),
        getDocumentTypes(undefined, 'INTERNAL'),
        structureApi.getStructure(),
      ]);

      setStandard(stdData);
      setDocTypes(typesData);

      // Extract all branches from organizations
      const allBranches: BranchTreeItem[] = [];
      if (structData.organizations) {
        structData.organizations.forEach((org: OrganizationTreeItem) => {
          if (org.branches) {
            allBranches.push(...org.branches);
          }
        });
      }
      setBranches(allBranches);

      if (typesData.length > 0) {
        setSelectedTypeId(typesData[0].id);
      }
      if (allBranches.length > 0) {
        setSelectedBranchId(allBranches[0].id);
      }
    } catch (err: unknown) {
      const e = err as { message?: string; details?: { detail?: string } };
      setError(e.details?.detail || e.message || 'Error al cargar la información del estándar de numeración');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTypeId || !selectedBranchId) {
      setPreviewError('Debe seleccionar un tipo documental y una sede.');
      return;
    }

    try {
      setPreviewLoading(true);
      setPreviewError(null);

      const res = await previewDocumentNumbering({
        document_type_id: selectedTypeId,
        branch_id: selectedBranchId,
        period_year: Number(periodYear),
        sample_correlative: Number(sampleCorrelative),
      });

      setPreviewResult(res);
    } catch (err: unknown) {
      const e = err as { message?: string; details?: { detail?: string } };
      setPreviewError(e.details?.detail || e.message || 'Error al generar la vista previa del código');
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
        Cargando estándar canónico de numeración...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔢</span>
              <h1 className="text-2xl font-black text-white tracking-tight">
                Estándar Canónico de Códigos Documentales
              </h1>
              <span className="px-3 py-1 bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold rounded-full">
                Fase 012
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-2 max-w-3xl">
              Norma técnica canónica para la identificación y codificación visible de documentos internos mediante la estructura{' '}
              <strong className="text-indigo-400 font-mono">TIPO-SEDE-AÑO-CORRELATIVO</strong> y preservación incondicional de numeración legal externa.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-mono">
            <span className="text-slate-400">Patrón:</span>
            <span className="text-emerald-400 font-bold">{standard?.pattern || '{TYPE}-{BRANCH}-{YEAR}-{SEQUENCE}'}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-sm flex items-center gap-3">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {standard?.segments.map((seg) => (
          <div
            key={seg.key}
            className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 bg-indigo-950 border border-indigo-700/50 text-indigo-400 text-xs font-mono font-bold rounded">
                  {seg.key}
                </span>
                <span className="text-xs text-slate-500 font-mono">ej: {seg.example}</span>
              </div>
              <h3 className="text-base font-bold text-white mb-1">{seg.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{seg.description}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
              Origen: <span className="text-slate-400">{seg.source}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Interactive Grid: Playground & Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Preview Form */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🧪</span> Generador de Vista Previa (Preview)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Prueba interactiva del algoritmo canónico de resolución y formateo del backend.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-950/60 border border-amber-800/50 text-amber-300 text-[11px] font-mono rounded-lg">
              No Consume Correlativo
            </span>
          </div>

          <form onSubmit={handlePreview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Tipo Documental (Alcance INTERNO)
                </label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {docTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      [{dt.code}] {dt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Sede Operativa Emisora (Branch)
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      [{b.code}] {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Año del Periodo (Period Year)
                </label>
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={periodYear}
                  onChange={(e) => setPeriodYear(parseInt(e.target.value) || 2026)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Correlativo de Ejemplo (Sample Correlative)
                </label>
                <input
                  type="number"
                  min={1}
                  max={999999}
                  value={sampleCorrelative}
                  onChange={(e) => setSampleCorrelative(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {previewError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl text-rose-300 text-xs">
                ⚠️ {previewError}
              </div>
            )}

            <button
              type="submit"
              disabled={previewLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {previewLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Calculando código en backend...</span>
                </>
              ) : (
                <>
                  <span>🔍 Generar Vista Previa del Código</span>
                </>
              )}
            </button>
          </form>

          {/* Preview Result Display */}
          {previewResult && (
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
              <div className="bg-slate-950 border border-indigo-900/50 rounded-2xl p-5 text-center relative overflow-hidden">
                <div className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">
                  Código Canónico Resultante
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-wider my-2">
                  {previewResult.preview}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                  <span className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-mono rounded-lg">
                    Formato Válido
                  </span>
                  <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-400 text-xs font-mono rounded-lg">
                    Reservado: {previewResult.reserved ? 'SÍ' : 'NO'}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-400 text-xs font-mono rounded-lg">
                    Asignado: {previewResult.allocated ? 'SÍ' : 'NO'}
                  </span>
                </div>
                <p className="text-xs text-amber-400/90 mt-3 italic">
                  ℹ️ {previewResult.message}
                </p>
              </div>

              {/* Structured Identity Breakdown */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Identidad Estructurada (Persistencia en DB)
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="text-slate-400">Organización ID:</div>
                  <div className="text-slate-300 truncate">{previewResult.structured_identity.organization_id}</div>
                  <div className="text-slate-400">Tipo Documental:</div>
                  <div className="text-indigo-400 font-bold">
                    {previewResult.structured_identity.document_type_code} ({previewResult.structured_identity.document_type_id.slice(0, 8)}...)
                  </div>
                  <div className="text-slate-400">Sede Emisora:</div>
                  <div className="text-indigo-400 font-bold">
                    {previewResult.structured_identity.branch_code} ({previewResult.structured_identity.branch_id.slice(0, 8)}...)
                  </div>
                  <div className="text-slate-400">Año del Periodo:</div>
                  <div className="text-slate-200">{previewResult.structured_identity.period_year}</div>
                  <div className="text-slate-400">Correlativo Numérico:</div>
                  <div className="text-emerald-400 font-bold">{previewResult.structured_identity.correlative}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Rules, Policies & Legal Preservation */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Canonical Policies */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🛡️</span> Reglas de Integridad Canónica
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-indigo-300 flex items-center justify-between">
                  <span>Política de No Reutilización</span>
                  <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-800/50 rounded font-mono text-[10px]">
                    REUSE_POLICY = NEVER
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Una vez que un correlativo es asignado oficialmente (F013), jamás puede ser reutilizado ni reemitido, incluso si el documento es anulado, rechazado o cancelado.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-indigo-300 flex items-center justify-between">
                  <span>Ámbito de Unicidad</span>
                  <span className="px-2 py-0.5 bg-indigo-950 text-indigo-400 border border-indigo-800/50 rounded font-mono text-[10px]">
                    SCOPE = ORGANIZATION
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  La unicidad operacional queda garantizada por la tupla estructurada <code className="text-slate-300">(org_id, type_id, branch_id, year, correlative)</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-indigo-300 flex items-center justify-between">
                  <span>Autoridad Absoluta del Backend</span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded font-mono text-[10px]">
                    BACKEND_AUTHORITY
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  El frontend nunca genera números oficiales ni incrementa correlativos. Todo código es calculado y emitido exclusivamente por el backend.
                </p>
              </div>
            </div>
          </div>

          {/* Card: External Documents Preservation */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">📑</span>
              <h3 className="text-base font-bold text-white">
                Documentos Externos y Oficiales
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Los documentos de origen externo (proveedores, transportistas, entidades regulatorias) poseen serie y número legal propio (ej. <strong className="text-slate-200">Guía de Remisión Proveedor F001-00004567</strong>).
            </p>

            <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-indigo-300">
                Preservación Legal Incondicional:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li><code className="text-slate-300">preserve_external_number = true</code></li>
                <li>Conserva <strong className="text-slate-200">official_series</strong> y <strong className="text-slate-200">official_number</strong> originales.</li>
                <li>La aplicación <strong className="text-rose-400">NO renombra ni renumera</strong> documentos externos.</li>
                <li>Soporte para <strong className="text-indigo-400">identidad dual</strong> (recepción interna + correlativo legal).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
