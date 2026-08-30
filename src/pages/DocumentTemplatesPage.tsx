import { useState, useEffect, useCallback } from 'react';
import {
  fetchTemplates,
  fetchSamplePdfBlob,
  fetchPurchasingSamplePdfBlob,
  fetchReceivingSamplePdfBlob,
  fetchInventorySamplePdfBlob,
  fetchOutboundSamplePdfBlob,
  fetchOutboundSampleHtml,
  downloadSamplePdf,
  downloadOutboundSamplePdf,
  downloadPurchasingSamplePdf,
  downloadReceivingSamplePdf,
  downloadInventorySamplePdf,
  TemplateManifest,
} from '../api/templates';
import { getDocumentTypes, DocumentType } from '../api/documents';
import { ApiError } from '../api/client';
import './DocumentModules.css';

const PURCHASING_DOC_MAP: Record<string, string> = {
  purchase_requisition_v1: 'REQ',
  request_for_quotation_v1: 'RFQ',
  comparative_table_v1: 'CMP',
  purchase_order_v1: 'PO',
  purchase_approval_v1: 'POA',
  supplier_send_confirmation_v1: 'PSC',
};

const RECEIVING_DOC_MAP: Record<string, string> = {
  arrival_appointment_v1: 'ARR',
  gate_control_v1: 'CPV',
  receiving_report_v1: 'REC',
  goods_receipt_v1: 'GRN',
  receiving_difference_v1: 'RDIFF',
  receiving_diff_v1: 'RDIFF',
  non_conformity_v1: 'NC',
};


const OUTBOUND_DOC_MAP: Record<string, string> = {
  outbound_request_v1: 'OUT_REQ',
  outbound_order_v1: 'ODS',
  picking_list_v1: 'PICK',
  picking_sheet_v1: 'PICK',
  packing_list_v1: 'PACK',
  manifest_v1: 'MNF',
  cargo_manifest_v1: 'MNF',
  dispatch_report_v1: 'DSP',
  dispatch_guide_v1: 'DSP',
  seal_control_v1: 'SEAL',
};

const INVENTORY_DOC_MAP: Record<string, string> = {
  location_label_v1: 'LBL',
  inventory_movement_v1: 'MOV',
  inventory_adjustment_v1: 'INV_ADJ',
  physical_count_v1: 'CNT',
  stock_count_v1: 'CNT',
  count_difference_v1: 'CDIFF',
  warehouse_transfer_v1: 'TRF',
  transfer_request_v1: 'TRF',
  transfer_receipt_v1: 'TRF_REC',
};

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateManifest[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string>('ALL');

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('arrival_appointment_v1');
  const [previewStatus, setPreviewStatus] = useState<string>('SCHEDULED');
  const [previewScenario, setPreviewScenario] = useState<string>('basic');
  const [previewRows, setPreviewRows] = useState<number>(10);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
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

  const loadPdfPreview = async (templateKey: string, status: string, scenario: string, rows: number) => {
    try {
      setLoadingPdf(true);
      if (pdfBlobUrl) {
        window.URL.revokeObjectURL(pdfBlobUrl);
      }
      let blobUrl = '';
      const outCode = OUTBOUND_DOC_MAP[templateKey];
      const purchCode = PURCHASING_DOC_MAP[templateKey];
      const recvCode = RECEIVING_DOC_MAP[templateKey];
      const invCode = INVENTORY_DOC_MAP[templateKey];

      if (outCode) {
        const [pdfUrl, html] = await Promise.all([
          fetchOutboundSamplePdfBlob(outCode, { scenario, statusCode: status }),
          fetchOutboundSampleHtml(outCode, { scenario, statusCode: status }),
        ]);
        blobUrl = pdfUrl;
        setHtmlContent(html);
      } else if (invCode) {
        blobUrl = await fetchInventorySamplePdfBlob(invCode, {
          scenario,
          statusCode: status,
        });
      } else if (recvCode) {
        blobUrl = await fetchReceivingSamplePdfBlob(recvCode, {
          scenario,
          statusCode: status,
        });
      } else if (purchCode) {
        blobUrl = await fetchPurchasingSamplePdfBlob(purchCode, {
          scenario,
          statusCode: status,
        });
      } else {
        blobUrl = await fetchSamplePdfBlob({
          statusCode: status,
          rowsCount: rows,
        });
      }
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
    let defaultStatus = 'DRAFT';
    if (templateKey === 'outbound_request_v1') defaultStatus = 'READY';
    else if (templateKey === 'outbound_order_v1') defaultStatus = 'CREATED';
    else if (templateKey === 'picking_list_v1' || templateKey === 'picking_sheet_v1') defaultStatus = 'PICKING';
    else if (templateKey === 'packing_list_v1') defaultStatus = 'SEALED';
    else if (templateKey === 'manifest_v1' || templateKey === 'cargo_manifest_v1') defaultStatus = 'LOADED';
    else if (templateKey === 'dispatch_report_v1' || templateKey === 'dispatch_guide_v1') defaultStatus = 'EMITTED';
    else if (templateKey === 'seal_control_v1') defaultStatus = 'ISSUED';
    else if (templateKey === 'location_label_v1') defaultStatus = 'ACTIVE';
    else if (templateKey === 'inventory_movement_v1') defaultStatus = 'EXECUTED';
    else if (templateKey === 'inventory_adjustment_v1') defaultStatus = 'APPROVED';
    else if (templateKey === 'physical_count_v1' || templateKey === 'stock_count_v1') defaultStatus = 'IN_PROGRESS';
    else if (templateKey === 'count_difference_v1') defaultStatus = 'DRAFT';
    else if (templateKey === 'warehouse_transfer_v1' || templateKey === 'transfer_request_v1') defaultStatus = 'IN_TRANSIT';
    else if (templateKey === 'transfer_receipt_v1') defaultStatus = 'RECEIVED';
    else if (templateKey === 'arrival_appointment_v1') defaultStatus = 'SCHEDULED';
    else if (templateKey === 'gate_control_v1') defaultStatus = 'INSIDE';
    else if (templateKey === 'receiving_report_v1') defaultStatus = 'COMPLETED';
    else if (templateKey === 'goods_receipt_v1' || templateKey === 'non_conformity_v1') defaultStatus = 'ISSUED';
    else if (templateKey === 'receiving_difference_v1' || templateKey === 'receiving_diff_v1') defaultStatus = 'OPEN';
    else if (templateKey === 'purchase_approval_v1') defaultStatus = 'APPROVED';
    else if (templateKey === 'supplier_send_confirmation_v1') defaultStatus = 'PROCESSED';

    setPreviewStatus(defaultStatus);
    setPreviewScenario('basic');
    setPreviewRows(10);
    setShowPreviewModal(true);
    loadPdfPreview(templateKey, defaultStatus, 'basic', 10);
  };

  const handleClosePreview = () => {
    setShowPreviewModal(false);
    if (pdfBlobUrl) {
      window.URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
      setHtmlContent(null);
    }
  };

  const handleDownload = async () => {
    try {
      const outCode = OUTBOUND_DOC_MAP[selectedTemplateKey];
      const purchCode = PURCHASING_DOC_MAP[selectedTemplateKey];
      const recvCode = RECEIVING_DOC_MAP[selectedTemplateKey];
      const invCode = INVENTORY_DOC_MAP[selectedTemplateKey];

      if (outCode) {
        await downloadOutboundSamplePdf(outCode, {
          scenario: previewScenario,
          statusCode: previewStatus,
          filename: `muestra_${outCode.toLowerCase()}_${previewScenario}_${previewStatus.toLowerCase()}.pdf`,
        });
      } else if (invCode) {
        await downloadInventorySamplePdf(invCode, {
          scenario: previewScenario,
          statusCode: previewStatus,
          filename: `muestra_${invCode.toLowerCase()}_${previewScenario}_${previewStatus.toLowerCase()}.pdf`,
        });
      } else if (recvCode) {
        await downloadReceivingSamplePdf(recvCode, {
          scenario: previewScenario,
          statusCode: previewStatus,
          filename: `muestra_${recvCode.toLowerCase()}_${previewScenario}_${previewStatus.toLowerCase()}.pdf`,
        });
      } else if (purchCode) {
        await downloadPurchasingSamplePdf(purchCode, {
          scenario: previewScenario,
          statusCode: previewStatus,
          filename: `muestra_${purchCode.toLowerCase()}_${previewScenario}_${previewStatus.toLowerCase()}.pdf`,
        });
      } else {
        await downloadSamplePdf({
          statusCode: previewStatus,
          rowsCount: previewRows,
          filename: `muestra_${selectedTemplateKey}_${previewStatus.toLowerCase()}.pdf`,
        });
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert('Error al descargar el archivo PDF.');
      }
    }
  };

  const filteredTemplates = templates.filter((tpl) => {
    if (selectedFamilyFilter === 'ALL') return true;
    return tpl.family.toUpperCase() === selectedFamilyFilter;
  });

  const isOutbound = Boolean(OUTBOUND_DOC_MAP[selectedTemplateKey]);
  const isInventory = Boolean(INVENTORY_DOC_MAP[selectedTemplateKey]);
  const isReceiving = Boolean(RECEIVING_DOC_MAP[selectedTemplateKey]);
  const isPurchasing = Boolean(PURCHASING_DOC_MAP[selectedTemplateKey]);

  return (
    <section className="document-module document-templates" aria-labelledby="document-templates-title">
      {/* Header */}
      <div className="dm-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 id="document-templates-title" style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Plantillas Documentales y Renderizado PDF</h1>
            <span
              style={{
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px',
                border: '1px solid #bfdbfe',
              }}
            >
              Fase 018 (Salida y Despacho)
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Motor central de plantillas HTML/CSS compiladas en backend a PDF A4 mediante WeasyPrint 69.0,
            con snapshots inmutables SHA-256, códigos QR técnicos y paquetes documentales de Compras (F015), Recepción (F016) Inventario (F017) y Salida/Despacho (F018).
          </p>
        </div>

        <button
          className="dm-button dm-button--primary"
          onClick={() => handleOpenPreview('receiving_report_v1')}
          style={{
            backgroundColor: '#0284c7',
            color: '#fff',
            border: 'none',
            padding: '10px 18px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.2)',
          }}
        >
          📋 Vista Previa Acta de Recepción
        </button>
      </div>

      {/* Metric Cards */}
      <div className="dm-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="dm-metric" style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Paquete de Salidas (F018)</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0369a1', marginTop: '6px' }}>7 Plantillas Oficiales</div>
          <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px' }}>✓ PED, ODS, PICK, PACK, MNF, DSP, SEAL</div>
        </div>

        <div className="dm-metric" style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Paquete de Inventario (F017)</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#059669', marginTop: '6px' }}>7 Plantillas Oficiales</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>✓ LBL, MOV, ADJ, CNT, CDIFF, TRF, TREC</div>
        </div>

        <div className="dm-metric" style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Paquete de Recepción (F016)</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0284c7', marginTop: '6px' }}>6 Plantillas de Ingreso</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>✓ ARR, CPV, REC, GRN, RDIFF, NC</div>
        </div>

        <div className="dm-metric" style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Paquete de Compras (F015)</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>6 Plantillas Oficiales</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>✓ REQ, RFQ, CMP, PO, POA, PSC</div>
        </div>

        <div className="dm-metric" style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Seguridad & Hashing</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#7c3aed', marginTop: '6px' }}>SHA-256 Dual-Stage</div>
          <div style={{ fontSize: '12px', color: '#7c3aed', marginTop: '4px' }}>Snapshot Hash (QR) + PDF Hash</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="dm-pills" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { id: 'ALL', label: 'Todas las Plantillas' },
          { id: 'OUTBOUND', label: 'Salida y Despacho (F018)' },
          { id: 'INVENTORY', label: 'Inventario y Almacén (F017)' },
          { id: 'RECEIVING', label: 'Recepción e Ingresos (F016)' },
          { id: 'PURCHASING', label: 'Compras y Adquisiciones (F015)' },
          { id: 'BASE', label: 'Plantillas Base Universales' },
        ].map((tab) => (
          <button
            className={`dm-pill ${selectedFamilyFilter === tab.id ? 'is-active' : ''}`}
            key={tab.id}
            onClick={() => setSelectedFamilyFilter(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: selectedFamilyFilter === tab.id ? '1px solid #0284c7' : '1px solid #cbd5e1',
              backgroundColor: selectedFamilyFilter === tab.id ? '#f0f9ff' : '#ffffff',
              color: selectedFamilyFilter === tab.id ? '#0369a1' : '#475569',
              fontWeight: selectedFamilyFilter === tab.id ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="dm-state" style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Cargando catálogo de plantillas...</div>
      ) : error ? (
        <div className="dm-alert dm-alert--error" role="alert" style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '20px' }}>{error}</div>
      ) : (
        <div style={{ display: 'grid', gap: '32px' }}>
          {/* Section: Manifiestos de Plantillas Registradas */}
          <div>
            <h2 style={{ fontSize: '18px', color: '#0f172a', marginBottom: '12px' }}>
              Registro Canónico de Plantillas ({filteredTemplates.length})
            </h2>
            <div className="dm-table-card dm-table-scroll" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
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
                  {filteredTemplates.map((tpl) => (
                    <tr key={tpl.template_key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                        <code>{tpl.template_key}</code>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 400, marginTop: '2px' }}>
                          {tpl.title}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            backgroundColor:
                              tpl.family === 'receiving' ? '#e0f2fe' : (tpl.family === 'purchasing' ? '#dbeafe' : '#f1f5f9'),
                            color:
                              tpl.family === 'receiving' ? '#0369a1' : (tpl.family === 'purchasing' ? '#1e40af' : '#475569'),
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          {tpl.family.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>v{tpl.version}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: tpl.orientation === 'landscape' ? 700 : 400, color: tpl.orientation === 'landscape' ? '#7c3aed' : '#0f172a' }}>
                          {tpl.page_size} ({tpl.orientation})
                        </span>
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
                          className="dm-button dm-button--primary dm-button--small"
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
            <div className="dm-table-card dm-table-scroll" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px' }}>Código Tipo</th>
                    <th style={{ padding: '12px 16px' }}>Nombre Documento</th>
                    <th style={{ padding: '12px 16px' }}>Ámbito</th>
                    <th style={{ padding: '12px 16px' }}>Versión Activa</th>
                    <th style={{ padding: '12px 16px' }}>Plantilla Enlazada</th>
                    <th style={{ padding: '12px 16px' }}>Estado Plantilla</th>
                  </tr>
                </thead>
                <tbody>
                  {docTypes
                    .filter((dt) => {
                      if (selectedFamilyFilter === 'ALL') return true;
                      if (selectedFamilyFilter === 'OUTBOUND') return ['OUT_REQ', 'ODS', 'PICK', 'PACK', 'MNF', 'DSP', 'SEAL'].includes(dt.code);
                      if (selectedFamilyFilter === 'INVENTORY') return ['LBL', 'MOV', 'INV_ADJ', 'CNT', 'CDIFF', 'TRF', 'TRF_REC'].includes(dt.code);
                      if (selectedFamilyFilter === 'RECEIVING') return ['ARR', 'CPV', 'REC', 'GRN', 'RDIFF', 'NC'].includes(dt.code);
                      if (selectedFamilyFilter === 'PURCHASING') return ['REQ', 'RFQ', 'CMP', 'PO', 'POA', 'PSC'].includes(dt.code);
                      return true;
                    })
                    .map((dt) => {
                      const versionNum = dt.current_version_number ?? 1;
                      const hasTemplate = Boolean(dt.current_template_key);
                      return (
                        <tr key={dt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                            <code>{dt.code}</code>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#0f172a' }}>{dt.name}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: dt.document_scope === 'INTERNAL' ? '#f1f5f9' : '#fef3c7', color: dt.document_scope === 'INTERNAL' ? '#334155' : '#92400e', fontWeight: 600 }}>
                              {dt.document_scope}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>v{versionNum}</td>
                          <td style={{ padding: '12px 16px' }}>
                            {hasTemplate ? (
                              <code>{dt.current_template_key}</code>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Plantilla base estándar</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '12px' }}>✓ Soportada</span>
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

      {/* Modal Preview PDF */}
      {showPreviewModal && (
        <div
          className="dm-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="dm-modal dm-modal--preview"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-preview-title"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '1050px',
              height: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              className="dm-modal-header"
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
              }}
            >
              <div>
                <h3 id="template-preview-title" style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                  Vista Previa PDF: <code>{selectedTemplateKey}</code>
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  Generado en backend con WeasyPrint 69.0, hashes criptográficos SHA-256 y QR embebido.
                </p>
              </div>

              <div className="dm-modal-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  className="dm-button dm-button--primary"
                  onClick={handleDownload}
                  disabled={loadingPdf}
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: loadingPdf ? 'not-allowed' : 'pointer',
                  }}
                >
                  📥 Descargar PDF
                </button>
                <button
                  className="dm-button dm-button--secondary"
                  onClick={handleClosePreview}
                  style={{
                    backgroundColor: '#e2e8f0',
                    color: '#0f172a',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>

            {/* Controls Bar */}
            <div
              className="dm-preview-controls"
              style={{
                padding: '12px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                backgroundColor: '#ffffff',
                fontSize: '13px',
              }}
            >
              <div>
                <label style={{ fontWeight: 600, color: '#334155', marginRight: '6px' }}>Estado Documento:</label>
                <select
                  value={previewStatus}
                  onChange={(e) => {
                    const nextStatus = e.target.value;
                    setPreviewStatus(nextStatus);
                    loadPdfPreview(selectedTemplateKey, nextStatus, previewScenario, previewRows);
                  }}
                  style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  {isReceiving ? (
                    <>
                      <option value="SCHEDULED">SCHEDULED (Programado)</option>
                      <option value="INSIDE">INSIDE (En Patio / Garita)</option>
                      <option value="COMPLETED">COMPLETED (Inspeccionado)</option>
                      <option value="ISSUED">ISSUED (Emitido)</option>
                      <option value="OPEN">OPEN (Discrepancias Abiertas)</option>
                      <option value="DRAFT">DRAFT (Borrador)</option>
                      <option value="VOID">VOID (Anulado)</option>
                    </>
                  ) : (
                    <>
                      <option value="DRAFT">DRAFT (Borrador con marca de agua)</option>
                      <option value="APPROVED">APPROVED (Aprobado)</option>
                      <option value="ISSUED">ISSUED (Emitido)</option>
                      <option value="VOID">VOID (Anulado con marca de agua)</option>
                    </>
                  )}
                </select>
              </div>

              {isOutbound || isInventory || isReceiving || isPurchasing ? (
                <div>
                  <label style={{ fontWeight: 600, color: '#334155', marginRight: '6px' }}>Escenario de Prueba:</label>
                  <select
                    value={previewScenario}
                    onChange={(e) => {
                      const nextScenario = e.target.value;
                      setPreviewScenario(nextScenario);
                      loadPdfPreview(selectedTemplateKey, previewStatus, nextScenario, previewRows);
                    }}
                    style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    <option value="basic">Escenario Básico (Estándar)</option>
                    {isOutbound && <option value="high_priority">🚨 Prioridad Alta / Urgente (OUT_REQ/ODS)</option>}
                    {isOutbound && <option value="multi_package">📦 Múltiples Bultos (PACK)</option>}
                    {isOutbound && <option value="with_difference">⚠️ Con Discrepancias (DSP)</option>}
                    {isOutbound && <option value="replacement">🔒 Reemplazo de Precinto (SEAL)</option>}
                    {isInventory && selectedTemplateKey.includes('count') && (
                      <option value="blind">👁️ Conteo Ciego (Blind Count - Saldo oculto)</option>
                    )}
                    <option value="multipage">Multipágina (50 ítems / bultos)</option>
                    <option value="long_text">Texto Largo / Justificación Extensa</option>
                    {isInventory && <option value="difference">Con Desviaciones / Discrepancias</option>}
                    {isReceiving && <option value="observed">Observado / Diferencias de Descarga</option>}
                    {isReceiving && <option value="partial">Recepción Parcial de Carga</option>}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={{ fontWeight: 600, color: '#334155', marginRight: '6px' }}>Líneas de Tabla:</label>
                  <select
                    value={previewRows}
                    onChange={(e) => {
                      const nextRows = Number(e.target.value);
                      setPreviewRows(nextRows);
                      loadPdfPreview(selectedTemplateKey, previewStatus, previewScenario, nextRows);
                    }}
                    style={{ padding: '5px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  >
                    <option value={5}>5 líneas (1 página)</option>
                    <option value={10}>10 líneas (1 página)</option>
                    <option value={35}>35 líneas (Multipágina ~2 páginas)</option>
                    <option value={80}>80 líneas (Multipágina ~3-4 páginas)</option>
                  </select>
                </div>
              )}

              {loadingPdf && (
                <span style={{ color: '#2563eb', fontWeight: 600 }}>Generando PDF en backend...</span>
              )}
            </div>

            {/* PDF Viewer Body */}
            <div className="dm-preview-frame" style={{ flex: 1, backgroundColor: '#525659', position: 'relative' }}>
              {loadingPdf ? (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 600,
                  }}
                >
                  Compilando documento PDF con WeasyPrint 69.0...
                </div>
              ) : htmlContent ? (
                <iframe
                  srcDoc={htmlContent}
                  title="Document Preview"
                  style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#ffffff' }}
                />
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="PDF Preview"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: '#cbd5e1',
                  }}
                >
                  No se pudo cargar el visor de PDF.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
