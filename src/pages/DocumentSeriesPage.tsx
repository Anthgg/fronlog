import { useState, useEffect, useCallback } from 'react';
import {
  fetchDocumentSeries,
  createDocumentSeries,
  reserveDocumentCorrelatives,
  fetchSeriesNumbers,
  voidDocumentNumber,
  downloadReservationBookletCsv,
  fetchDocumentSeriesDetail,
  DocumentSeriesResponse,
  DocumentSeriesReservationResponse,
  DocumentSeriesNumberResponse,
  DocumentSeriesDetailResponse,
} from '../api/series';
import { getDocumentTypes, DocumentType } from '../api/documents';
import { structureApi, BranchTreeItem, OrganizationTreeItem } from '../api/structure';
import { StepUpDialog, StepUpChallengeInfo } from '../components/StepUpDialog';
import { ApiError } from '../api/client';

export default function DocumentSeriesPage() {
  const [seriesList, setSeriesList] = useState<DocumentSeriesResponse[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [branches, setBranches] = useState<BranchTreeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterBranch, setFilterBranch] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<DocumentSeriesResponse | null>(null);
  const [showNumbersDrawer, setShowNumbersDrawer] = useState(false);
  const [selectedSeriesDetail, setSelectedSeriesDetail] = useState<DocumentSeriesDetailResponse | null>(null);
  const [seriesNumbers, setSeriesNumbers] = useState<DocumentSeriesNumberResponse[]>([]);
  const [numbersFilterStatus, setNumbersFilterStatus] = useState<string>('');
  const [loadingNumbers, setLoadingNumbers] = useState(false);

  // Forms state
  const [createDocTypeId, setCreateDocTypeId] = useState('');
  const [createBranchId, setCreateBranchId] = useState('');
  const [createYear, setCreateYear] = useState<number>(new Date().getFullYear());
  const [reserveQty, setReserveQty] = useState<number>(10);
  const [reserveReason, setReserveReason] = useState<string>('');
  const [reservationResult, setReservationResult] = useState<DocumentSeriesReservationResponse | null>(null);

  // Void modal state
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [selectedNumberToVoid, setSelectedNumberToVoid] = useState<DocumentSeriesNumberResponse | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Step-up MFA modal state
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [stepUpChallenge, setStepUpChallenge] = useState<StepUpChallengeInfo | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [seriesRes, typesRes, structRes] = await Promise.all([
        fetchDocumentSeries({
          document_type_id: filterType || undefined,
          branch_id: filterBranch || undefined,
          period_year: filterYear ? parseInt(filterYear, 10) : undefined,
        }),
        getDocumentTypes(),
        structureApi.getStructure(),
      ]);
      setSeriesList(seriesRes);
      setDocTypes(typesRes.filter((t: DocumentType) => t.document_scope === 'INTERNAL'));

      const allBranches: BranchTreeItem[] = [];
      structRes.organizations.forEach((org: OrganizationTreeItem) => {
        if (org.branches) {
          allBranches.push(...org.branches);
        }
      });
      setBranches(allBranches);

      if (allBranches.length > 0 && !createBranchId) {
        setCreateBranchId(allBranches[0].id);
      }
      const internalTypes = typesRes.filter((t: DocumentType) => t.document_scope === 'INTERNAL');
      if (internalTypes.length > 0 && !createDocTypeId) {
        setCreateDocTypeId(internalTypes[0].id);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Error al cargar las series documentales.');
      }
    } finally {
      setLoading(false);
    }
  }, [filterType, filterBranch, filterYear, createBranchId, createDocTypeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadSeriesNumbers = async (seriesId: string, statusFilter?: string) => {
    try {
      setLoadingNumbers(true);
      const [detail, numbers] = await Promise.all([
        fetchDocumentSeriesDetail(seriesId),
        fetchSeriesNumbers(seriesId, { status: statusFilter || undefined }),
      ]);
      setSelectedSeriesDetail(detail);
      setSeriesNumbers(numbers);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert('Error al cargar correlativos de la serie.');
      }
    } finally {
      setLoadingNumbers(false);
    }
  };

  const handleOpenNumbersDrawer = (series: DocumentSeriesResponse) => {
    setSelectedSeries(series);
    setShowNumbersDrawer(true);
    setNumbersFilterStatus('');
    loadSeriesNumbers(series.id);
  };

  // Helper for step-up challenge
  const handlePotentialStepUp = (err: unknown, retryAction: () => Promise<void>) => {
    if (err instanceof ApiError && err.status === 428) {
      const challenge: StepUpChallengeInfo = {
        challengeId: (err.details?.challenge_id as string) || '',
        policy: (err.details?.policy as string) || '',
        reason: (err.details?.reason as string) || err.message,
        methods: (err.details?.methods as string[]) || ['TOTP'],
        expiresAt: (err.details?.expires_at as string) || '',
      };
      setStepUpChallenge(challenge);
      setPendingAction(() => retryAction);
      setStepUpOpen(true);
    } else if (err instanceof ApiError) {
      alert(err.message);
    } else {
      alert('Ha ocurrido un error inesperado.');
    }
  };

  // Create Series with Step-Up handling
  const executeCreateSeries = async () => {
    try {
      await createDocumentSeries({
        document_type_id: createDocTypeId,
        branch_id: createBranchId,
        period_year: createYear,
      });
      setShowCreateModal(false);
      await loadData();
    } catch (err: unknown) {
      handlePotentialStepUp(err, executeCreateSeries);
    }
  };

  // Reserve Correlatives with Step-Up handling
  const executeReserveCorrelatives = async () => {
    if (!selectedSeries) return;
    try {
      const res = await reserveDocumentCorrelatives(selectedSeries.id, {
        quantity: reserveQty,
        reason: reserveReason.trim() || undefined,
      });
      setReservationResult(res);
      await loadData();
      if (showNumbersDrawer && selectedSeriesDetail?.id === selectedSeries.id) {
        await loadSeriesNumbers(selectedSeries.id, numbersFilterStatus);
      }
    } catch (err: unknown) {
      handlePotentialStepUp(err, executeReserveCorrelatives);
    }
  };

  // Void Number with Step-Up handling
  const executeVoidNumber = async () => {
    if (!selectedNumberToVoid || !selectedSeries) return;
    try {
      await voidDocumentNumber(selectedNumberToVoid.id, {
        reason: voidReason.trim(),
      });
      setShowVoidModal(false);
      setVoidReason('');
      setSelectedNumberToVoid(null);
      await loadSeriesNumbers(selectedSeries.id, numbersFilterStatus);
      await loadData();
    } catch (err: unknown) {
      handlePotentialStepUp(err, executeVoidNumber);
    }
  };

  const handleDownloadBooklet = async (reservationId: string) => {
    try {
      await downloadReservationBookletCsv(reservationId);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        alert(err.message);
      } else {
        alert('Error al descargar el talonario CSV.');
      }
    }
  };

  const totalReserved = seriesList.reduce((acc, s) => acc + s.reserved_count, 0);
  const totalVoided = seriesList.reduce((acc, s) => acc + s.voided_count, 0);

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>Series Digitales y Talonarios</h1>
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
              Fase 013
            </span>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '14px' }}>
            Control de series por organización, sede y periodo con reserva transaccional locked por SELECT FOR UPDATE y
            talonarios CSV sin reutilización.
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            setReservationResult(null);
          }}
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
          + Nueva Serie Digital
        </button>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Series Activas</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>{seriesList.length}</div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Ámbito: Tipo + Sede + Periodo</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Correlativos Reservados</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb', marginTop: '6px' }}>{totalReserved}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Asignación monótona asegurada</div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>Correlativos Anulados</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626', marginTop: '6px' }}>{totalVoided}</div>
          <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Conservados inmutables (Sin reutilizar)</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff' }}
        >
          <option value="">Todos los tipos documentales</option>
          {docTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.code} - {t.name}
            </option>
          ))}
        </select>

        <select
          value={filterBranch}
          onChange={(e) => setFilterBranch(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff' }}
        >
          <option value="">Todas las sedes</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.code} - {b.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Año (ej. 2026)"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', width: '130px', backgroundColor: '#fff' }}
        />

        {(filterType || filterBranch || filterYear) && (
          <button
            onClick={() => {
              setFilterType('');
              setFilterBranch('');
              setFilterYear('');
            }}
            style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', cursor: 'pointer', fontSize: '13px' }}
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Series Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Cargando series documentales...</div>
      ) : error ? (
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '20px' }}>{error}</div>
      ) : seriesList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
          No se encontraron series digitales configuradas con los filtros actuales.
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>Prefijo / Serie</th>
                <th style={{ padding: '12px 16px' }}>Tipo Documental</th>
                <th style={{ padding: '12px 16px' }}>Sede</th>
                <th style={{ padding: '12px 16px' }}>Periodo</th>
                <th style={{ padding: '12px 16px' }}>Próximo Correlativo</th>
                <th style={{ padding: '12px 16px' }}>Reservados</th>
                <th style={{ padding: '12px 16px' }}>Anulados</th>
                <th style={{ padding: '12px 16px' }}>Estado</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {seriesList.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                    <code style={{ backgroundColor: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', color: '#1e293b' }}>
                      {s.series_prefix}
                    </code>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{s.document_type_code}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{s.document_type_name}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 500 }}>{s.branch_code}</span> ({s.branch_name})
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.period_year}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{String(s.next_correlative).padStart(s.correlative_width, '0')}</span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#2563eb', fontWeight: 600 }}>{s.reserved_count}</td>
                  <td style={{ padding: '12px 16px', color: s.voided_count > 0 ? '#dc2626' : '#64748b', fontWeight: 600 }}>{s.voided_count}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: s.is_active ? '#dcfce7' : '#f1f5f9',
                        color: s.is_active ? '#15803d' : '#64748b',
                      }}
                    >
                      {s.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => {
                          setSelectedSeries(s);
                          setReserveQty(10);
                          setReserveReason('');
                          setReservationResult(null);
                          setShowReserveModal(true);
                        }}
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
                        Reservar Rango
                      </button>
                      <button
                        onClick={() => handleOpenNumbersDrawer(s)}
                        style={{
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Números & Talonario
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Crear Nueva Serie Digital */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '480px', maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#0f172a' }}>Nueva Serie Digital</h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                Tipo Documental (Alcance INTERNAL)
              </label>
              <select
                value={createDocTypeId}
                onChange={(e) => setCreateDocTypeId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                {docTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.code} — {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                Sede Emisora
              </label>
              <select
                value={createBranchId}
                onChange={(e) => setCreateBranchId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                Periodo Anual (YYYY)
              </label>
              <input
                type="number"
                min={2000}
                max={2100}
                value={createYear}
                onChange={(e) => setCreateYear(parseInt(e.target.value, 10))}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={executeCreateSeries}
                style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
              >
                Crear Serie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reservar Rango */}
      {showReserveModal && selectedSeries && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '520px', maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a' }}>
              Reservar Rango de Correlativos
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#64748b' }}>
              Serie: <strong>{selectedSeries.series_prefix}</strong> | Próximo inicial decidido por backend:{' '}
              <span style={{ color: '#2563eb', fontWeight: 700 }}>
                {String(selectedSeries.next_correlative).padStart(selectedSeries.correlative_width, '0')}
              </span>
            </p>

            {reservationResult ? (
              <div style={{ padding: '16px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', marginBottom: '20px' }}>
                <div style={{ color: '#065f46', fontWeight: 700, fontSize: '15px' }}>✓ ¡Reserva Generada Exitosamente!</div>
                <div style={{ fontSize: '13px', color: '#047857', marginTop: '8px' }}>
                  <div>Cantidad: <strong>{reservationResult.quantity}</strong> números</div>
                  <div>Rango asignado: <strong>{reservationResult.start_correlative}</strong> al <strong>{reservationResult.end_correlative}</strong></div>
                  <div>Primer código: <code style={{ fontWeight: 700 }}>{reservationResult.first_display_code}</code></div>
                  <div>Último código: <code style={{ fontWeight: 700 }}>{reservationResult.last_display_code}</code></div>
                </div>
                <button
                  onClick={() => handleDownloadBooklet(reservationResult.id)}
                  style={{
                    marginTop: '12px',
                    backgroundColor: '#059669',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  📥 Descargar Talonario CSV
                </button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                    Cantidad de Correlativos (1 a 500)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={reserveQty}
                    onChange={(e) => setReserveQty(parseInt(e.target.value, 10))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Límite canónico: MAX_RESERVATION_SIZE = 500 por transacción atómica.
                  </span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                    Motivo Operacional (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Emisión masiva de compras turno matutino"
                    value={reserveReason}
                    onChange={(e) => setReserveReason(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowReserveModal(false);
                  setReservationResult(null);
                }}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
              >
                {reservationResult ? 'Cerrar' : 'Cancelar'}
              </button>
              {!reservationResult && (
                <button
                  onClick={executeReserveCorrelatives}
                  style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                >
                  Confirmar Reserva
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drawer / Vista de Números & Talonario */}
      {showNumbersDrawer && selectedSeries && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'flex-end',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              width: '850px',
              maxWidth: '90%',
              height: '100%',
              overflowY: 'auto',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>
                  Inventario de Correlativos: {selectedSeries.series_prefix}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                  {selectedSeries.document_type_name} — Sede {selectedSeries.branch_code} — Año {selectedSeries.period_year}
                </p>
              </div>
              <button
                onClick={() => setShowNumbersDrawer(false)}
                style={{ border: 'none', background: 'transparent', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* List of Reservations in this series */}
            {selectedSeriesDetail?.reservations && selectedSeriesDetail.reservations.length > 0 && (
              <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155' }}>Talonarios y Lotes Reservados</h4>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {selectedSeriesDetail.reservations.map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>
                          Rango: {r.start_correlative}..{r.end_correlative} ({r.quantity} números)
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          <code>{r.first_display_code}</code> ➔ <code>{r.last_display_code}</code> | {new Date(r.reserved_at).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadBooklet(r.id)}
                        style={{
                          backgroundColor: '#0284c7',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        📥 Descargar CSV
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Numbers Filter */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Filtrar Estado:</span>
              <select
                value={numbersFilterStatus}
                onChange={(e) => {
                  setNumbersFilterStatus(e.target.value);
                  loadSeriesNumbers(selectedSeries.id, e.target.value);
                }}
                style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                <option value="">Todos los correlativos</option>
                <option value="RESERVED">Reservados</option>
                <option value="VOIDED">Anulados</option>
              </select>
            </div>

            {/* Individual Numbers Table */}
            {loadingNumbers ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Cargando números...</div>
            ) : seriesNumbers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '6px', color: '#64748b' }}>
                No hay correlativos registrados en esta serie aún.
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '10px 14px' }}>#</th>
                      <th style={{ padding: '10px 14px' }}>Código Visible</th>
                      <th style={{ padding: '10px 14px' }}>Estado</th>
                      <th style={{ padding: '10px 14px' }}>Fecha Reserva</th>
                      <th style={{ padding: '10px 14px' }}>Detalle Anulación</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seriesNumbers.map((n) => (
                      <tr key={n.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{n.correlative}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <code>{n.display_code}</code>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: n.status === 'VOIDED' ? '#fee2e2' : '#dbeafe',
                              color: n.status === 'VOIDED' ? '#991b1b' : '#1e40af',
                            }}
                          >
                            {n.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', color: '#64748b' }}>
                          {new Date(n.reserved_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '12px', color: '#dc2626' }}>
                          {n.void_reason ? (
                            <div>
                              <strong>Motivo:</strong> {n.void_reason}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          {n.status === 'RESERVED' && (
                            <button
                              onClick={() => {
                                setSelectedNumberToVoid(n);
                                setVoidReason('');
                                setShowVoidModal(true);
                              }}
                              style={{
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fca5a5',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Anular
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Anular Número */}
      {showVoidModal && selectedNumberToVoid && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
          }}
        >
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '460px', maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#991b1b' }}>
              Anulación Formal de Correlativo
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569' }}>
              ¿Está seguro de anular el código <strong>{selectedNumberToVoid.display_code}</strong>?
            </p>
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#92400e',
              }}
            >
              ⚠️ <strong>Regla de Oro:</strong> Una vez anulado, este correlativo quedará registrado formalmente como VOIDED y{' '}
              <strong>jamás será reutilizado</strong>.
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                Motivo Obligatorio de Anulación
              </label>
              <textarea
                rows={3}
                placeholder="Indique la justificación formal (mínimo 3 caracteres)..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowVoidModal(false);
                  setSelectedNumberToVoid(null);
                }}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                disabled={voidReason.trim().length < 3}
                onClick={executeVoidNumber}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  backgroundColor: voidReason.trim().length < 3 ? '#94a3b8' : '#dc2626',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  cursor: voidReason.trim().length < 3 ? 'not-allowed' : 'pointer',
                }}
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step-Up Challenge Dialog */}
      <StepUpDialog
        isOpen={stepUpOpen}
        challenge={stepUpChallenge}
        onCancel={() => {
          setStepUpOpen(false);
          setStepUpChallenge(null);
          setPendingAction(null);
        }}
        onSuccess={async () => {
          setStepUpOpen(false);
          setStepUpChallenge(null);
          if (pendingAction) {
            await pendingAction();
            setPendingAction(null);
          }
        }}
      />
    </div>
  );
}
