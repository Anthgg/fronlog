import { useState, useEffect, useCallback } from 'react';
import {
  fetchTemplates,
  fetchSamplePdfBlob,
  downloadSamplePdf,
  TemplateManifest,
} from '../api/templates';
import { getDocumentTypes, DocumentType } from '../api/documents';
import { ApiError } from '../api/client';

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateManifest[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('base_document_v1');
  const [previewStatus, setPreviewStatus] = useState<string>('DRAFT');
  const [previewRows, setPreviewRows] = useState<number>(10);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tplRes, typesRes] = await Promise.all([
        fetchTemplates(),
        getDocumentTypes(),
      ]);
      setTemplates(tplRes);
      setDocTypes(typesRes);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error al cargar la información de plantillas.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadPdfPreview = async (status: string, rows: number) => {
    try {
      setLoadingPdf(true);
      if (pdfBlobUrl) {
        window.URL.revokeObjectURL(pdfBlobUrl);
      }
      const blobUrl = await fetchSamplePdfBlob({
        statusCode: status,
        rowsCount: rows,
      });
      setPdfBlobUrl(blobUrl);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert('Error al generar la vista previa del PDF.');
      }
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleOpenPreview = (templateKey: string) => {
    setSelectedTemplateKey(templateKey);
    setPreviewStatus('DRAFT');
    setPreviewRows(10);
    setShowPreviewModal(true);
    loadPdfPreview('DRAFT', 10);
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    if (pdfBlobUrl) {
      window.URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadSamplePdf({
        statusCode: previewStatus,
        rowsCount: previewRows,
        filename: `muestra_${selectedTemplateKey}_${previewStatus.toLowerCase()}.pdf`,
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert('Error al descargar el archivo PDF.');
      }
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Plantillas Documentales y Renderizado PDF</h1>
            <span
              style={{
                backgroundColor: '#e0e7ff',
                color: '#4338ca',
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid #c7d2fe',
              }}
            >
              Fase 014
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Motor centralizado de plantillas HTML/CSS compiladas en backend a PDF A4 mediante WeasyPrint, con
            serialización canónica JSON, hashes SHA-256 e integración de código QR de verificación técnica.
          </p>
        </div>

        <button
          onClick={() => handleOpenPreview('base_document_v1')}
          style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
          }}
        >
          👁️ Vista Previa Base PDF
        </button>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Plantilla Base Universal</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>base_document_v1</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>✓ A4, Encabezado, Tablas, QR, Firma</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Motor de Renderizado</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#2563eb', marginTop: '6px' }}>WeasyPrint 69.0</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>CSS Paged Media + Jinja2 Sandbox</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Seguridad & Hashing</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#7c3aed', marginTop: '6px' }}>SHA-256 Dual-Stage</div>
          <div style={{ fontSize: '12px', color: '#7c3aed', marginTop: '4px' }}>Snapshot Hash (QR) + PDF Hash</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Cargando catálogo de plantillas...</div>
      ) : error ? (
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '20px' }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gap: '32px' }}>
          {/* Section: Manifiestos de Plantillas Registradas */}
          <div>
            <h2 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '12px' }}>
              Registro Canónico de Plantillas (Backend Registry)
            </h2>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>Clave Plantilla</th>
                    <th style={{ padding: '12px 16px' }}>Familia</th>
                    <th style={{ padding: '12px 16px' }}>Versión</th>
                    <th style={{ padding: '12px 16px' }}>Formato</th>
                    <th style={{ padding: '12px 16px' }}>Motor</th>
                    <th style={{ padding: '12px 16px' }}>Estados</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((tpl) => (
                    <tr key={tpl.template_key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                        <code>{tpl.template_key}</code>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400, marginTop: '2px' }}>
                          {tpl.title}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>
                          {tpl.family.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>v{tpl.version}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {tpl.page_size} ({tpl.orientation})
                      </td>
                      <td style={{ padding: '12px 16px', color: '#2563eb', fontWeight: 600 }}>{tpl.supported_renderer}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {tpl.supported_statuses.map((st) => (
                            <span key={st} style={{ fontSize: '11px', padding: '1px 5px', borderRadius: '3px', backgroundColor: '#e2e8f0', color: '#334155' }}>
                              {st}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleOpenPreview(tpl.template_key)}
                          style={{
                            backgroundColor: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Ver Muestra PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Catálogo vs Plantilla */}
          <div>
            <h2 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '12px' }}>
              Asignación en Catálogo Documental (F011)
            </h2>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>Código</th>
                    <th style={{ padding: '12px 16px' }}>Tipo Documental</th>
                    <th style={{ padding: '12px 16px' }}>Familia</th>
                    <th style={{ padding: '12px 16px' }}>Alcance</th>
                    <th style={{ padding: '12px 16px' }}>Plantilla Asignada</th>
                    <th style={{ padding: '12px 16px' }}>Disponibilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {docTypes.map((dt) => {
                    const isBaseAvailable = dt.current_template_key === 'base_document_v1' || !dt.current_template_key;
                    return (
                      <tr key={dt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                          <code>{dt.code}</code>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{dt.name}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>{dt.family_name || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: dt.document_scope === 'INTERNAL' ? '#0284c7' : '#d97706' }}>
                            {dt.document_scope}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <code>{dt.current_template_key || 'base_document_v1'}</code>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {isBaseAvailable ? (
                            <span style={{ padding: '3px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#dcfce7', color: '#15803d' }}>
                              ✓ Base Disponible
                            </span>
                          ) : (
                            <span style={{ padding: '3px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, backgroundColor: '#f1f5f9', color: '#64748b' }}>
                              Pendiente ({dt.phase_owner || 'F015+'})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Live PDF Preview Modal */}
      {showPreviewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              width: '950px',
              maxWidth: '95%',
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal Header & Controls */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                  Visor Oficial de Renderizado PDF — {selectedTemplateKey}
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  Generado en vivo exclusivamente por WeasyPrint backend con encabezados, hash SHA-256 y QR embebido.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Estado:</span>
                  <select
                    value={previewStatus}
                    onChange={(e) => {
                      setPreviewStatus(e.target.value);
                      loadPdfPreview(e.target.value, previewRows);
                    }}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value="DRAFT">DRAFT (Borrador con marca de agua)</option>
                    <option value="APPROVED">APPROVED (Aprobado)</option>
                    <option value="ISSUED">ISSUED (Emitido oficial)</option>
                    <option value="VOID">VOID (Anulado)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Filas:</span>
                  <select
                    value={previewRows}
                    onChange={(e) => {
                      const r = parseInt(e.target.value, 10);
                      setPreviewRows(r);
                      loadPdfPreview(previewStatus, r);
                    }}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value={5}>5 Filas (1 Página)</option>
                    <option value={15}>15 Filas (1-2 Páginas)</option>
                    <option value={35}>35 Filas (2 Páginas con salto)</option>
                    <option value={60}>60 Filas (3+ Páginas multipágina)</option>
                  </select>
                </div>

                <button
                  onClick={handleDownload}
                  style={{
                    backgroundColor: '#059669',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  📥 Descargar PDF
                </button>

                <button
                  onClick={handleClosePreview}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#64748b',
                    marginLeft: '8px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: PDF Viewer */}
            <div style={{ flex: 1, backgroundColor: '#525659', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loadingPdf ? (
                <div style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>Compilando documento PDF en backend...</div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="PDF Preview"
                />
              ) : (
                <div style={{ color: '#cbd5e1' }}>No se pudo cargar la vista previa.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
