import React, { useCallback, useEffect, useState } from 'react';
import {
  structureApi,
  type StructureResponse,
  type OrganizationHierarchyItem,
  type BranchHierarchyItem,
  type WarehouseHierarchyItem,
  type ApiErrorResponse,
} from '../api/structure';
import './AdminModules.css';

export const StructurePage: React.FC = () => {
  const [structure, setStructure] = useState<StructureResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Selected entities
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Modal controls
  const [showOrgModal, setShowOrgModal] = useState<boolean>(false);
  const [showBranchModal, setShowBranchModal] = useState<boolean>(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState<boolean>(false);

  // Form states - Org
  const [orgCode, setOrgCode] = useState<string>('');
  const [orgName, setOrgName] = useState<string>('');
  const [orgIsTest, setOrgIsTest] = useState<boolean>(false);

  // Form states - Branch
  const [branchCode, setBranchCode] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');
  const [branchAddress, setBranchAddress] = useState<string>('');
  const [branchDistrict, setBranchDistrict] = useState<string>('');
  const [branchProvince, setBranchProvince] = useState<string>('');
  const [branchDepartment, setBranchDepartment] = useState<string>('');
  const [branchLat, setBranchLat] = useState<string>('');
  const [branchLon, setBranchLon] = useState<string>('');
  const [branchIsTest, setBranchIsTest] = useState<boolean>(false);

  // Form states - Warehouse
  const [whCode, setWhCode] = useState<string>('');
  const [whName, setWhName] = useState<string>('');
  const [whUseBranchLoc, setWhUseBranchLoc] = useState<boolean>(true);
  const [whAddress, setWhAddress] = useState<string>('');
  const [whDistrict, setWhDistrict] = useState<string>('');
  const [whProvince, setWhProvince] = useState<string>('');
  const [whDepartment, setWhDepartment] = useState<string>('');
  const [whLat, setWhLat] = useState<string>('');
  const [whLon, setWhLon] = useState<string>('');
  const [whIsTest, setWhIsTest] = useState<boolean>(false);

  const fetchStructure = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setErrorCode(null);
      const data = await structureApi.getStructure();
      setStructure(data);
      if (data.organizations.length > 0 && !selectedOrgId) {
        setSelectedOrgId(data.organizations[0].id);
        if (data.organizations[0].branches.length > 0) {
          setSelectedBranchId(data.organizations[0].branches[0].id);
        }
      }
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      setErrorCode(apiErr.code || 'FETCH_ERROR');
      setErrorMessage(apiErr.message || 'Error cargando la estructura');
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    fetchStructure();
  }, [fetchStructure]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage(null);
      await structureApi.createOrganization({
        code: orgCode.trim(),
        name: orgName.trim(),
        is_test_data: orgIsTest,
      });
      setShowOrgModal(false);
      setOrgCode('');
      setOrgName('');
      setOrgIsTest(false);
      await fetchStructure();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      setErrorCode(apiErr.code);
      setErrorMessage(apiErr.message);
    }
  };

  const handleDeleteOrg = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta organización?')) return;
    try {
      setErrorMessage(null);
      await structureApi.deleteOrganization(id);
      if (selectedOrgId === id) setSelectedOrgId('');
      await fetchStructure();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      setErrorCode(apiErr.code);
      setErrorMessage(apiErr.message);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgId) return;
    try {
      setErrorMessage(null);
      await structureApi.createBranch(selectedOrgId, {
        code: branchCode.trim(),
        name: branchName.trim(),
        is_test_data: branchIsTest,
        location: {
          label: branchName.trim(),
          address_line1: branchAddress.trim(),
          district: branchDistrict.trim() || undefined,
          province: branchProvince.trim() || undefined,
          department: branchDepartment.trim() || undefined,
          country_code: 'PE',
          latitude: branchLat ? parseFloat(branchLat) : undefined,
          longitude: branchLon ? parseFloat(branchLon) : undefined,
        },
      });
      setShowBranchModal(false);
      setBranchCode('');
      setBranchName('');
      setBranchAddress('');
      setBranchDistrict('');
      setBranchProvince('');
      setBranchDepartment('');
      setBranchLat('');
      setBranchLon('');
      setBranchIsTest(false);
      await fetchStructure();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      setErrorCode(apiErr.code);
      setErrorMessage(apiErr.message);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta sede?')) return;
    try {
      setErrorMessage(null);
      await structureApi.deleteBranch(id);
      if (selectedBranchId === id) setSelectedBranchId('');
      await fetchStructure();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      setErrorCode(apiErr.code);
      setErrorMessage(apiErr.message);
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) return;
    try {
      setErrorMessage(null);
      await structureApi.createWarehouse(selectedBranchId, {
        code: whCode.trim(),
        name: whName.trim(),
        use_branch_location: whUseBranchLoc,
        is_test_data: whIsTest,
        custom_location: whUseBranchLoc
          ? undefined
          : {
              label: whName.trim(),
              address_line1: whAddress.trim(),
              district: whDistrict.trim() || undefined,
              province: whProvince.trim() || undefined,
              department: whDepartment.trim() || undefined,
              country_code: 'PE',
              latitude: whLat ? parseFloat(whLat) : undefined,
              longitude: whLon ? parseFloat(whLon) : undefined,
            },
      });
      setShowWarehouseModal(false);
      setWhCode('');
      setWhName('');
      setWhUseBranchLoc(true);
      setWhAddress('');
      setWhDistrict('');
      setWhProvince('');
      setWhDepartment('');
      setWhLat('');
      setWhLon('');
      setWhIsTest(false);
      await fetchStructure();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      setErrorCode(apiErr.code);
      setErrorMessage(apiErr.message);
    }
  };

  const handleDeleteWarehouse = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este almacén?')) return;
    try {
      setErrorMessage(null);
      await structureApi.deleteWarehouse(id);
      await fetchStructure();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      setErrorCode(apiErr.code);
      setErrorMessage(apiErr.message);
    }
  };

  const selectedOrg = structure?.organizations.find((o) => o.id === selectedOrgId);
  const selectedBranch = selectedOrg?.branches.find((b) => b.id === selectedBranchId);

  return (
    <section className="admin-page" aria-labelledby="structure-title">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header__copy">
          <span className="admin-header__eyebrow">Red logística</span>
          <h1 id="structure-title">Estructura y almacenes</h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Jerarquía Multi-Sede y Multi-Almacén persistida en PostgreSQL con Supabase
          </p>
        </div>
        <button
          type="button"
          onClick={fetchStructure}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Actualizar
        </button>
      </header>

      {/* Error Banner */}
      {errorMessage && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
          style={{
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #f87171',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#991b1b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>Error [{errorCode}]:</strong> {errorMessage}
          </div>
          <button
            className="admin-alert__close"
            type="button"
            aria-label="Cerrar mensaje de error"
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {loading && !structure ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando estructura...</div>
      ) : (
        <div className="admin-structure-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          {/* Hierarchy Tree Sidebar */}
          <aside className="admin-tree" aria-label="Árbol logístico" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
            <div className="admin-tree__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#334155' }}>Árbol Logístico</h3>
              <button
                className="admin-button--primary"
                type="button"
                onClick={() => setShowOrgModal(true)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Nueva organización
              </button>
            </div>

            {structure?.organizations.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                No hay organizaciones registradas
              </div>
            ) : (
              <div style={{ fontSize: '14px' }}>
                {structure?.organizations.map((org: OrganizationHierarchyItem) => (
                  <div key={org.id} style={{ marginBottom: '12px' }}>
                    <div
                      className={`admin-tree-item ${selectedOrgId === org.id ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedOrgId(org.id);
                        if (org.branches.length > 0) setSelectedBranchId(org.branches[0].id);
                      }}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: selectedOrgId === org.id ? '#eff6ff' : 'transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: selectedOrgId === org.id ? 600 : 500,
                        color: selectedOrgId === org.id ? '#1d4ed8' : '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{org.name}</span>
                      {org.is_test_data && (
                        <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '10px' }}>
                          Demo
                        </span>
                      )}
                    </div>

                    {/* Branches */}
                    <div style={{ paddingLeft: '16px', marginTop: '4px' }}>
                      {org.branches.map((b: BranchHierarchyItem) => (
                        <div key={b.id} style={{ marginBottom: '4px' }}>
                          <div
                            className={`admin-tree-item ${selectedBranchId === b.id ? 'is-selected' : ''}`}
                            onClick={() => {
                              setSelectedOrgId(org.id);
                              setSelectedBranchId(b.id);
                            }}
                            style={{
                              padding: '4px 6px',
                              backgroundColor: selectedBranchId === b.id ? '#f1f5f9' : 'transparent',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              color: selectedBranchId === b.id ? '#0f172a' : '#475569',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>{b.name}</span>
                            {b.is_test_data && (
                              <span style={{ fontSize: '9px', backgroundColor: '#fef3c7', color: '#92400e', padding: '1px 4px', borderRadius: '8px' }}>
                                Demo
                              </span>
                            )}
                          </div>

                          {/* Warehouses */}
                          <div style={{ paddingLeft: '14px', marginTop: '2px' }}>
                            {b.warehouses.map((w: WarehouseHierarchyItem) => (
                              <div
                                className="admin-tree-leaf"
                                key={w.id}
                                style={{
                                  fontSize: '12px',
                                  color: '#64748b',
                                  padding: '2px 4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <span>{w.name}</span>
                                {w.is_test_data && (
                                  <span style={{ fontSize: '8px', backgroundColor: '#fef3c7', color: '#92400e', padding: '1px 4px', borderRadius: '6px' }}>
                                    Demo
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Details & Management Panel */}
          <div className="admin-structure-details">
            {selectedOrg ? (
              <div>
                {/* Organization Card */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{selectedOrg.name}</h2>
                        <span style={{ fontSize: '12px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                          Código: {selectedOrg.code}
                        </span>
                        {selectedOrg.is_test_data && (
                          <span style={{ fontSize: '11px', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>
                            Datos Demo
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Total Sedes: {selectedOrg.branches.length}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setShowBranchModal(true)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        + Nueva Sede
                      </button>
                      <button
                        onClick={() => handleDeleteOrg(selectedOrg.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fecaca',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Eliminar Org
                      </button>
                    </div>
                  </div>
                </div>

                {/* Branches & Warehouses Table */}
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#334155' }}>
                    Sedes y Almacenes de {selectedOrg.name}
                  </h3>

                  {selectedOrg.branches.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '14px' }}>
                      Esta organización aún no tiene sedes registradas.
                    </div>
                  ) : (
                    selectedOrg.branches.map((branch: BranchHierarchyItem) => (
                      <div
                        key={branch.id}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          padding: '12px',
                          marginBottom: '16px',
                          backgroundColor: '#f8fafc',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '15px', color: '#1e293b' }}>📍 {branch.name}</span>
                            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#64748b' }}>({branch.code})</span>
                            {branch.is_test_data && (
                              <span style={{ marginLeft: '8px', fontSize: '10px', backgroundColor: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '8px' }}>
                                Demo
                              </span>
                            )}
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                              Dirección: {branch.location?.address_line1}, {branch.location?.district || ''} {branch.location?.department || ''}
                              {branch.location?.latitude && ` (Lat: ${branch.location.latitude}, Lon: ${branch.location.longitude})`}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setSelectedBranchId(branch.id);
                                setShowWarehouseModal(true);
                              }}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              + Almacén
                            </button>
                            <button
                              onClick={() => handleDeleteBranch(branch.id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c',
                                border: '1px solid #fecaca',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              Eliminar Sede
                            </button>
                          </div>
                        </div>

                        {/* Warehouses list inside branch */}
                        <div style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: '2px solid #cbd5e1' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                            Almacenes ({branch.warehouses.length}):
                          </div>
                          {branch.warehouses.length === 0 ? (
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Sin almacenes registrados en esta sede.</div>
                          ) : (
                            branch.warehouses.map((wh: WarehouseHierarchyItem) => (
                              <div
                                key={wh.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '6px 8px',
                                  backgroundColor: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '4px',
                                  marginBottom: '4px',
                                  fontSize: '13px',
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: 500, color: '#0f172a' }}>📦 {wh.name}</span>
                                  <span style={{ marginLeft: '6px', color: '#64748b', fontSize: '12px' }}>({wh.code})</span>
                                  {wh.is_test_data && (
                                    <span style={{ marginLeft: '6px', fontSize: '9px', backgroundColor: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '6px' }}>
                                      Demo
                                    </span>
                                  )}
                                  <span style={{ marginLeft: '10px', color: '#94a3b8', fontSize: '11px' }}>
                                    Ubicación: {wh.location?.address_line1}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDeleteWarehouse(wh.id)}
                                  style={{
                                    padding: '2px 6px',
                                    fontSize: '11px',
                                    backgroundColor: '#fff1f2',
                                    color: '#e11d48',
                                    border: '1px solid #fecdd3',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Eliminar
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Selecciona o crea una Organización en el panel lateral para administrar sus Sedes y Almacenes.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal - Create Organization */}
      {showOrgModal && (
        <div className="admin-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-modal__panel" role="dialog" aria-modal="true" aria-labelledby="create-organization-title" style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', width: '400px', maxWidth: '90%' }}>
            <h3 id="create-organization-title" style={{ margin: '0 0 16px 0' }}>Nueva Organización</h3>
            <form onSubmit={handleCreateOrg}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Código *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. ORG-PERU-01"
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Nombre *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Logística del Perú S.A."
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="orgIsTest"
                  checked={orgIsTest}
                  onChange={(e) => setOrgIsTest(e.target.checked)}
                />
                <label htmlFor="orgIsTest" style={{ fontSize: '13px', color: '#475569' }}>Es dato sintético / prueba (Demo)</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Create Branch */}
      {showBranchModal && (
        <div className="admin-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-modal__panel" role="dialog" aria-modal="true" aria-labelledby="create-branch-title" style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', width: '480px', maxWidth: '90%' }}>
            <h3 id="create-branch-title" style={{ margin: '0 0 16px 0' }}>Nueva Sede en {selectedOrg?.name}</h3>
            <form onSubmit={handleCreateBranch}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Código *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. SEDE-LIM"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Sede Lima Norte"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Dirección *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Av. Los Industriales 123"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Distrito</label>
                  <input
                    type="text"
                    value={branchDistrict}
                    onChange={(e) => setBranchDistrict(e.target.value)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Provincia</label>
                  <input
                    type="text"
                    value={branchProvince}
                    onChange={(e) => setBranchProvince(e.target.value)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Departamento</label>
                  <input
                    type="text"
                    value={branchDepartment}
                    onChange={(e) => setBranchDepartment(e.target.value)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Latitud (-90 a 90)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-12.0464"
                    value={branchLat}
                    onChange={(e) => setBranchLat(e.target.value)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Longitud (-180 a 180)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-77.0428"
                    value={branchLon}
                    onChange={(e) => setBranchLon(e.target.value)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="branchIsTest"
                  checked={branchIsTest}
                  onChange={(e) => setBranchIsTest(e.target.checked)}
                />
                <label htmlFor="branchIsTest" style={{ fontSize: '13px', color: '#475569' }}>Es dato sintético / prueba (Demo)</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Guardar Sede
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Create Warehouse */}
      {showWarehouseModal && (
        <div className="admin-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="admin-modal__panel" role="dialog" aria-modal="true" aria-labelledby="create-warehouse-title" style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', width: '480px', maxWidth: '90%' }}>
            <h3 id="create-warehouse-title" style={{ margin: '0 0 16px 0' }}>Nuevo Almacén en {selectedBranch?.name}</h3>
            <form onSubmit={handleCreateWarehouse}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Código *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. ALM-01"
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Almacén Central"
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Shared Location Toggle */}
              <div style={{ marginBottom: '14px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="whUseBranchLoc"
                    checked={whUseBranchLoc}
                    onChange={(e) => setWhUseBranchLoc(e.target.checked)}
                  />
                  <label htmlFor="whUseBranchLoc" style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                    [✓] Usar misma ubicación física de la sede
                  </label>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', paddingLeft: '22px' }}>
                  {whUseBranchLoc
                    ? `Se asociará directamente la dirección: ${selectedBranch?.location?.address_line1 || 'Ubicación de la sede'}`
                    : 'Permite registrar una dirección o coordenadas independientes para este almacén.'}
                </div>
              </div>

              {!whUseBranchLoc && (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Dirección Almacén *</label>
                    <input
                      type="text"
                      required={!whUseBranchLoc}
                      placeholder="ej. Av. Faucett 3100"
                      value={whAddress}
                      onChange={(e) => setWhAddress(e.target.value)}
                      style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Distrito</label>
                      <input
                        type="text"
                        value={whDistrict}
                        onChange={(e) => setWhDistrict(e.target.value)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Provincia</label>
                      <input
                        type="text"
                        value={whProvince}
                        onChange={(e) => setWhProvince(e.target.value)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Departamento</label>
                      <input
                        type="text"
                        value={whDepartment}
                        onChange={(e) => setWhDepartment(e.target.value)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Latitud (-90 a 90)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="-12.0234"
                        value={whLat}
                        onChange={(e) => setWhLat(e.target.value)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>Longitud (-180 a 180)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="-77.1089"
                        value={whLon}
                        onChange={(e) => setWhLon(e.target.value)}
                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="whIsTest"
                  checked={whIsTest}
                  onChange={(e) => setWhIsTest(e.target.checked)}
                />
                <label htmlFor="whIsTest" style={{ fontSize: '13px', color: '#475569' }}>Es dato sintético / prueba (Demo)</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowWarehouseModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Guardar Almacén
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
