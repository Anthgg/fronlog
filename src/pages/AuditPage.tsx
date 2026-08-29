import React, { useCallback, useEffect, useState } from 'react';
import {
  AuditEvent,
  AuditEventDetail,
  AuditFilters,
  downloadAuditCsv,
  getAuditEvent,
  listAuditEvents,
} from '../api/audit';

export const AuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [resourceType, setResourceType] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [actorTypeFilter, setActorTypeFilter] = useState('');
  const [correlationIdFilter, setCorrelationIdFilter] = useState('');
  const [page, setPage] = useState(0);
  const limit = 15;

  // Detail Modal State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventDetail, setEventDetail] = useState<AuditEventDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: AuditFilters = {
        limit,
        offset: page * limit,
      };
      if (resourceType) filters.resource_type = resourceType;
      if (actionFilter) filters.action = actionFilter;
      if (resultFilter) filters.result = resultFilter;
      if (actorTypeFilter) filters.actor_type = actorTypeFilter;
      if (correlationIdFilter.trim()) filters.correlation_id = correlationIdFilter.trim();

      const data = await listAuditEvents(filters);
      setEvents(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar la bitácora de auditoría.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, resourceType, actionFilter, resultFilter, actorTypeFilter, correlationIdFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchEvents();
  };

  const handleClearFilters = () => {
    setResourceType('');
    setActionFilter('');
    setResultFilter('');
    setActorTypeFilter('');
    setCorrelationIdFilter('');
    setPage(0);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const filters: AuditFilters = {};
      if (resourceType) filters.resource_type = resourceType;
      if (actionFilter) filters.action = actionFilter;
      if (resultFilter) filters.result = resultFilter;
      if (actorTypeFilter) filters.actor_type = actorTypeFilter;
      if (correlationIdFilter.trim()) filters.correlation_id = correlationIdFilter.trim();

      await downloadAuditCsv(filters);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Error en exportación: ${message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleOpenDetail = async (eventId: string) => {
    setSelectedEventId(eventId);
    setLoadingDetail(true);
    setEventDetail(null);
    try {
      const detail = await getAuditEvent(eventId);
      setEventDetail(detail);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Error al obtener detalle: ${message}`);
      setSelectedEventId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const renderResultBadge = (result: string) => {
    switch (result) {
      case 'SUCCESS':
        return (
          <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
            SUCCESS
          </span>
        );
      case 'FAILURE':
        return (
          <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
            FAILURE
          </span>
        );
      case 'DENIED':
        return (
          <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
            DENIED
          </span>
        );
      default:
        return (
          <span style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
            {result}
          </span>
        );
    }
  };

  const renderActorBadge = (actorType: string) => {
    if (actorType === 'UNAUTHENTICATED') {
      return (
        <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, border: '1px solid #cbd5e1' }}>
          Sin autenticar
        </span>
      );
    }
    if (actorType === 'SYSTEM') {
      return (
        <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, border: '1px solid #bae6fd' }}>
          Sistema
        </span>
      );
    }
    return (
      <span style={{ backgroundColor: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, border: '1px solid #ddd6fe' }}>
        {actorType}
      </span>
    );
  };

  // Extract combined keys from before/after snapshots for comparison
  const getDiffKeys = (before: Record<string, unknown> | null, after: Record<string, unknown> | null): string[] => {
    const keys = new Set<string>();
    if (before && typeof before === 'object') Object.keys(before).forEach((k) => keys.add(k));
    if (after && typeof after === 'object') Object.keys(after).forEach((k) => keys.add(k));
    return Array.from(keys);
  };

  const formatValue = (val: unknown) => {
    if (val === null || val === undefined) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>null</span>;
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
            📜 Registro Unificado de Auditoría (Append-Only)
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Trazabilidad inmutable de eventos, capturas before/after, correlación transversal y exportación autorizada desde backend.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          style={{
            backgroundColor: '#059669',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: exporting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {exporting ? 'Generando CSV...' : '📥 Exportar CSV (Backend)'}
        </button>
      </div>

      {/* Info Card */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '12px', color: '#1e40af' }}>
        💡 <strong>Inmutabilidad y Trazabilidad (F007):</strong> Cada mutación sobre organizaciones, sedes, almacenes, roles y permisos genera un <code>AuditEvent</code> inmutable. Las operaciones actuales sin login registran <code>Sin autenticar</code> (preparado para vinculación con sesión en F008).
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleFilterSubmit} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Recurso</label>
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', minWidth: '140px' }}
          >
            <option value="">Todos</option>
            <option value="organization">Organización</option>
            <option value="branch">Sede</option>
            <option value="warehouse">Almacén</option>
            <option value="role">Rol</option>
            <option value="role_permission">Permisos de Rol</option>
            <option value="system">Sistema</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Acción</label>
          <input
            type="text"
            placeholder="ej. warehouse.update"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '160px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Resultado</label>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', minWidth: '120px' }}
          >
            <option value="">Todos</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
            <option value="DENIED">DENIED</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Actor</label>
          <select
            value={actorTypeFilter}
            onChange={(e) => setActorTypeFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', minWidth: '140px' }}
          >
            <option value="">Todos</option>
            <option value="UNAUTHENTICATED">Sin autenticar</option>
            <option value="SYSTEM">Sistema</option>
            <option value="AUTHENTICATED">Autenticado</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '180px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Correlation ID</label>
          <input
            type="text"
            placeholder="UUID de correlación..."
            value={correlationIdFilter}
            onChange={(e) => setCorrelationIdFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="submit"
            style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '7px 16px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            🔍 Filtrar
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '7px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            Limpiar
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Events Table */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Fecha / Hora (UTC)</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actor</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>IP</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Recurso</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Acción</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Resultado</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Motivo</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Correlación</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Cargando eventos de auditoría...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  No se encontraron eventos de auditoría con los filtros aplicados.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                    {new Date(e.occurred_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 16px' }}>{renderActorBadge(e.actor_type)}</td>
                  <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
                    {e.ip_address || '—'}
                  </td>
                  <td style={{ padding: '10px 16px', fontWeight: 500, color: '#334155' }}>{e.resource_type}</td>
                  <td style={{ padding: '10px 16px', color: '#0f172a', fontFamily: 'monospace', fontSize: '12px' }}>
                    {e.action}
                  </td>
                  <td style={{ padding: '10px 16px' }}>{renderResultBadge(e.result)}</td>
                  <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '12px' }}>{e.reason || '—'}</td>
                  <td style={{ padding: '10px 16px', color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>
                    {e.correlation_id.slice(0, 8)}...
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleOpenDetail(e.id)}
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#2563eb',
                        cursor: 'pointer',
                      }}
                    >
                      Ver Snapshots
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#64748b' }}>
          <div>
            Mostrando {events.length > 0 ? page * limit + 1 : 0} a {Math.min((page + 1) * limit, total)} de {total} eventos
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: page === 0 ? '#f1f5f9' : '#ffffff',
                color: page === 0 ? '#94a3b8' : '#334155',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                fontSize: '12px',
              }}
            >
              ◀ Anterior
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= total || loading}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                backgroundColor: (page + 1) * limit >= total ? '#f1f5f9' : '#ffffff',
                color: (page + 1) * limit >= total ? '#94a3b8' : '#334155',
                cursor: (page + 1) * limit >= total ? 'not-allowed' : 'pointer',
                fontSize: '12px',
              }}
            >
              Siguiente ▶
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEventId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setSelectedEventId(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetail || !eventDetail ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Cargando detalles del evento...</div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px 0' }}>
                      Detalle de Evento: <code>{eventDetail.action}</code>
                    </h2>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                      ID: <code>{eventDetail.id}</code>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEventId(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '18px',
                      cursor: 'pointer',
                      color: '#64748b',
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Metadata Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Fecha:</span> <strong>{new Date(eventDetail.occurred_at).toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Actor:</span> {renderActorBadge(eventDetail.actor_type)}
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Resultado:</span> {renderResultBadge(eventDetail.result)}
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>IP Origen:</span> <code>{eventDetail.ip_address || '—'}</code>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Recurso:</span> <code>{eventDetail.resource_type} ({eventDetail.resource_id ? String(eventDetail.resource_id).slice(0, 8) + '...' : '—'})</code>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Motivo:</span> <code>{eventDetail.reason || '—'}</code>
                  </div>
                  <div style={{ gridColumn: 'span 3' }}>
                    <span style={{ color: '#64748b' }}>Correlation ID:</span> <code>{eventDetail.correlation_id}</code>
                  </div>
                </div>

                {/* Before / After Snapshot Comparison */}
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                  📸 Snapshots Before / After
                </h3>
                {eventDetail.before_data || eventDetail.after_data ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '8px 12px', width: '25%' }}>Campo</th>
                        <th style={{ padding: '8px 12px', width: '37.5%' }}>Estado Anterior (Before)</th>
                        <th style={{ padding: '8px 12px', width: '37.5%' }}>Estado Posterior (After)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getDiffKeys(eventDetail.before_data, eventDetail.after_data).map((key) => {
                        const beforeVal = eventDetail.before_data ? eventDetail.before_data[key] : undefined;
                        const afterVal = eventDetail.after_data ? eventDetail.after_data[key] : undefined;
                        const isChanged = JSON.stringify(beforeVal) !== JSON.stringify(afterVal);
                        return (
                          <tr key={key} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isChanged ? '#fffbeb' : '#ffffff' }}>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{key}</td>
                            <td style={{ padding: '8px 12px', color: '#64748b' }}>{formatValue(beforeVal)}</td>
                            <td style={{ padding: '8px 12px', color: '#0f172a', fontWeight: isChanged ? 600 : 400 }}>{formatValue(afterVal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '20px' }}>
                    No se registraron snapshots de entidad para este evento.
                  </p>
                )}

                {/* Metadata JSON */}
                {eventDetail.metadata && Object.keys(eventDetail.metadata).length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                      Contexto y Metadatos Adicionales
                    </h3>
                    <pre style={{ backgroundColor: '#0f172a', color: '#38bdf8', padding: '12px', borderRadius: '6px', fontSize: '11px', overflowX: 'auto' }}>
                      {JSON.stringify(eventDetail.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <button
                    onClick={() => setSelectedEventId(null)}
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditPage;
