import React, { useCallback, useEffect, useState } from 'react';
import {
  rolesApi,
  type RoleResponse,
  type RoleMatrixResponse,
  type ApiErrorResponse,
} from '../api/roles';
import {
  permissionsApi,
  type PermissionResponse,
  type RoleEffectivePermissionsResponse,
  type EndpointPermissionMappingResponse,
} from '../api/permissions';
import { structureApi, type OrganizationHierarchyItem } from '../api/structure';

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [matrixData, setMatrixData] = useState<RoleMatrixResponse | null>(null);
  const [permissionsCatalog, setPermissionsCatalog] = useState<PermissionResponse[]>([]);
  const [endpointMatrix, setEndpointMatrix] = useState<EndpointPermissionMappingResponse[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationHierarchyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Main Section Tab
  const [activeSection, setActiveSection] = useState<
    'CATALOG' | 'RESPONSIBILITIES' | 'SOD' | 'PERMISSIONS_MATRIX' | 'ENDPOINT_MATRIX'
  >('CATALOG');

  // Filter in Catalog
  const [filterType, setFilterType] = useState<'ALL' | 'SYSTEM' | 'CUSTOM'>('ALL');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newOrgId, setNewOrgId] = useState<string>('');
  const [newIsTest, setNewIsTest] = useState<boolean>(false);

  // Edit Modal
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  // Permission Matrix Section State
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<RoleResponse | null>(null);
  const [selectedRolePerms, setSelectedRolePerms] = useState<RoleEffectivePermissionsResponse | null>(null);
  const [selectedPermCodes, setSelectedPermCodes] = useState<Set<string>>(new Set());
  const [permSearchTerm, setPermSearchTerm] = useState<string>('');
  const [savingPerms, setSavingPerms] = useState<boolean>(false);

  const fetchRolesData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setErrorCode(null);
      const [rolesData, structData, matrix, catalog, epMatrix] = await Promise.all([
        rolesApi.listRoles(),
        structureApi.getStructure(),
        rolesApi.getMatrix(),
        permissionsApi.listPermissions(),
        permissionsApi.getEndpointMatrix(),
      ]);
      setRoles(rolesData);
      setOrganizations(structData.organizations);
      setMatrixData(matrix);
      setPermissionsCatalog(catalog);
      setEndpointMatrix(epMatrix);

      if (rolesData.length > 0 && !selectedRoleForPerms) {
        setSelectedRoleForPerms(rolesData[0]);
      }
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      setErrorCode(apiErr.code || 'FETCH_ERROR');
      setErrorMessage(apiErr.message || 'Error al cargar catálogo de roles y matrices.');
    } finally {
      setLoading(false);
    }
  }, [selectedRoleForPerms]);

  useEffect(() => {
    fetchRolesData();
  }, [fetchRolesData]);

  // Fetch permissions when selected role changes
  useEffect(() => {
    if (!selectedRoleForPerms) return;
    let isMounted = true;
    permissionsApi
      .getRolePermissions(selectedRoleForPerms.id)
      .then((res) => {
        if (isMounted) {
          setSelectedRolePerms(res);
          setSelectedPermCodes(new Set(res.effective_codes));
        }
      })
      .catch((err) => {
        if (isMounted) {
          const apiErr = err as ApiErrorResponse;
          setErrorCode(apiErr.code);
          setErrorMessage(apiErr.message);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [selectedRoleForPerms]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage(null);
      const created = await rolesApi.createRole({
        code: newCode.trim(),
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        organization_id: newOrgId ? newOrgId : null,
        is_system: false,
        is_test_data: newIsTest,
      });
      setShowCreateModal(false);
      setNewCode('');
      setNewName('');
      setNewDesc('');
      setNewOrgId('');
      setNewIsTest(false);
      await fetchRolesData();
      setSelectedRoleForPerms(created);
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      setErrorCode(apiErr.code);
      setErrorMessage(apiErr.message);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole) return;
    try {
      setErrorMessage(null);
      await rolesApi.updateRole(editingRole.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        is_active: editIsActive,
      });
      setEditingRole(null);
      await fetchRolesData();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      setErrorCode(apiErr.code);
      setErrorMessage(apiErr.message);
    }
  };

  const handleDeleteRole = async (role: RoleResponse) => {
    if (role.is_system) {
      alert('Los roles base del sistema están protegidos y no pueden ser eliminados.');
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar el rol ${role.name}?`)) return;

    try {
      setErrorMessage(null);
      await rolesApi.deleteRole(role.id);
      await fetchRolesData();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      setErrorCode(apiErr.code);
      setErrorMessage(apiErr.message);
    }
  };

  const handleTogglePermission = (code: string) => {
    const updated = new Set(selectedPermCodes);
    if (updated.has(code)) {
      updated.delete(code);
    } else {
      updated.add(code);
    }
    setSelectedPermCodes(updated);
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRoleForPerms) return;
    try {
      setSavingPerms(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      const res = await permissionsApi.assignRolePermissions(selectedRoleForPerms.id, {
        permission_codes: Array.from(selectedPermCodes),
      });
      setSelectedRolePerms(res);
      setSelectedPermCodes(new Set(res.effective_codes));
      setSuccessMessage(`Permisos actualizados exitosamente para el rol "${selectedRoleForPerms.name}".`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      setErrorCode(apiErr.code);
      setErrorMessage(apiErr.message);
    } finally {
      setSavingPerms(false);
    }
  };

  const filteredRoles = roles.filter((role) => {
    if (filterType === 'SYSTEM') return role.is_system;
    if (filterType === 'CUSTOM') return !role.is_system;
    return true;
  });

  // Group permissions by category
  const categories = Array.from(new Set(permissionsCatalog.map((p) => p.category))).sort();

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return <span style={{ fontSize: '10px', backgroundColor: '#450a0a', color: '#fecaca', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>CRÍTICO</span>;
      case 'HIGH':
        return <span style={{ fontSize: '10px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>ALTO</span>;
      case 'MEDIUM':
        return <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '10px', fontWeight: 600 }}>MEDIO</span>;
      default:
        return <span style={{ fontSize: '10px', backgroundColor: '#f0fdf4', color: '#166534', padding: '2px 6px', borderRadius: '10px', fontWeight: 500 }}>BAJO</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', color: '#1e293b' }}>
            Control de Acceso RBAC & Catálogo Canónico
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            10 Perfiles Canónicos, {permissionsCatalog.length} Permisos por Acción, Matriz de Responsabilidades y Segregación de Funciones (SoD)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchRolesData}
            style={{
              padding: '8px 14px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            ↻ Actualizar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            + Nuevo Rol
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '8px',
            marginBottom: '20px',
            color: '#166534',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <strong>✓ Éxito:</strong> {successMessage}
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div
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
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Section Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSection('CATALOG')}
          style={{
            padding: '8px 14px',
            fontSize: '13px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeSection === 'CATALOG' ? '#2563eb' : '#f1f5f9',
            color: activeSection === 'CATALOG' ? '#ffffff' : '#334155',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          📋 Roles ({roles.length})
        </button>
        <button
          onClick={() => setActiveSection('PERMISSIONS_MATRIX')}
          style={{
            padding: '8px 14px',
            fontSize: '13px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeSection === 'PERMISSIONS_MATRIX' ? '#2563eb' : '#f1f5f9',
            color: activeSection === 'PERMISSIONS_MATRIX' ? '#ffffff' : '#334155',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🔑 Asignación de Permisos ({permissionsCatalog.length})
        </button>
        <button
          onClick={() => setActiveSection('RESPONSIBILITIES')}
          style={{
            padding: '8px 14px',
            fontSize: '13px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeSection === 'RESPONSIBILITIES' ? '#2563eb' : '#f1f5f9',
            color: activeSection === 'RESPONSIBILITIES' ? '#ffffff' : '#334155',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🛡️ Responsabilidades ({matrixData?.canonical_profiles.length || 10})
        </button>
        <button
          onClick={() => setActiveSection('SOD')}
          style={{
            padding: '8px 14px',
            fontSize: '13px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeSection === 'SOD' ? '#2563eb' : '#f1f5f9',
            color: activeSection === 'SOD' ? '#ffffff' : '#334155',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ⚖️ Segregación SoD ({matrixData?.sod_conflicts.length || 0})
        </button>
        <button
          onClick={() => setActiveSection('ENDPOINT_MATRIX')}
          style={{
            padding: '8px 14px',
            fontSize: '13px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: activeSection === 'ENDPOINT_MATRIX' ? '#2563eb' : '#f1f5f9',
            color: activeSection === 'ENDPOINT_MATRIX' ? '#ffffff' : '#334155',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🔒 Matriz Endpoint ↔ Permiso ({endpointMatrix.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando catálogo RBAC y matrices...</div>
      ) : (
        <>
          {/* SECTION 1: CATALOG */}
          {activeSection === 'CATALOG' && (
            <div>
              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  onClick={() => setFilterType('ALL')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: filterType === 'ALL' ? '#1e293b' : '#ffffff',
                    color: filterType === 'ALL' ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Todos ({roles.length})
                </button>
                <button
                  onClick={() => setFilterType('SYSTEM')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: filterType === 'SYSTEM' ? '#1e293b' : '#ffffff',
                    color: filterType === 'SYSTEM' ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Perfiles del Sistema ({roles.filter((r) => r.is_system).length})
                </button>
                <button
                  onClick={() => setFilterType('CUSTOM')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: filterType === 'CUSTOM' ? '#1e293b' : '#ffffff',
                    color: filterType === 'CUSTOM' ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Personalizados ({roles.filter((r) => !r.is_system).length})
                </button>
              </div>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                {filteredRoles.map((role) => {
                  const orgName = organizations.find((o) => o.id === role.organization_id)?.name;
                  return (
                    <div
                      key={role.id}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{role.name}</h3>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {role.is_system ? (
                              <span style={{ fontSize: '10px', backgroundColor: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                SISTEMA
                              </span>
                            ) : (
                              <span style={{ fontSize: '10px', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                                PERSONALIZADO
                              </span>
                            )}
                            {role.is_test_data && (
                              <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}>
                                Demo
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b', marginBottom: '8px' }}>
                          Código: <strong style={{ color: '#0284c7' }}>{role.code}</strong>
                        </div>

                        <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#475569', minHeight: '36px' }}>
                          {role.description || 'Sin descripción detallada.'}
                        </p>

                        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                          Ámbito: {role.organization_id ? `🏢 ${orgName || 'Organización específica'}` : '🌐 Global'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                        <span style={{ fontSize: '11px', color: role.is_active ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                          {role.is_active ? '● Activo' : '○ Inactivo'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setSelectedRoleForPerms(role);
                              setActiveSection('PERMISSIONS_MATRIX');
                            }}
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              backgroundColor: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            Permisos
                          </button>
                          <button
                            onClick={() => {
                              setEditingRole(role);
                              setEditName(role.name);
                              setEditDesc(role.description || '');
                              setEditIsActive(role.is_active);
                            }}
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            Editar
                          </button>
                          {!role.is_system && (
                            <button
                              onClick={() => handleDeleteRole(role)}
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
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: PERMISSIONS MATRIX MANAGER */}
          {activeSection === 'PERMISSIONS_MATRIX' && (
            <div>
              {/* Role Selector Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Rol a Gestionar:</label>
                  <select
                    value={selectedRoleForPerms?.id || ''}
                    onChange={(e) => {
                      const found = roles.find((r) => r.id === e.target.value);
                      if (found) setSelectedRoleForPerms(found);
                    }}
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '13px', fontWeight: 500 }}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code}) {r.is_system ? '[SISTEMA]' : '[CUSTOM]'}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Filtrar por acción o código..."
                    value={permSearchTerm}
                    onChange={(e) => setPermSearchTerm(e.target.value)}
                    style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '220px' }}
                  />
                  <button
                    onClick={handleSaveRolePermissions}
                    disabled={savingPerms}
                    style={{
                      padding: '8px 18px',
                      backgroundColor: savingPerms ? '#94a3b8' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: savingPerms ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    {savingPerms ? 'Guardando...' : '💾 Guardar Permisos'}
                  </button>
                </div>
              </div>

              {/* SoD Warnings if any */}
              {selectedRolePerms && selectedRolePerms.sod_warnings.length > 0 && (
                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px' }}>
                  <div style={{ color: '#92400e', fontWeight: 600, fontSize: '14px', marginBottom: '6px' }}>
                    ⚠️ Advertencia de Segregación de Funciones (SoD) Detectada:
                  </div>
                  {selectedRolePerms.sod_warnings.map((w, idx) => (
                    <div key={idx} style={{ fontSize: '13px', color: '#78350f', marginTop: '4px' }}>
                      • {typeof w === 'string' ? w : JSON.stringify(w)}
                    </div>
                  ))}
                </div>
              )}

              {/* Categorized Permissions Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
                {categories.map((cat) => {
                  const permsInCat = permissionsCatalog
                    .filter((p) => p.category === cat)
                    .filter((p) => {
                      if (!permSearchTerm) return true;
                      const term = permSearchTerm.toLowerCase();
                      return (
                        p.code.toLowerCase().includes(term) ||
                        p.name.toLowerCase().includes(term) ||
                        (p.description && p.description.toLowerCase().includes(term))
                      );
                    });

                  if (permsInCat.length === 0) return null;

                  const allChecked = permsInCat.every((p) => selectedPermCodes.has(p.code));

                  return (
                    <div
                      key={cat}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          padding: '10px 14px',
                          borderBottom: '1px solid #e2e8f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>{cat}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const next = new Set(selectedPermCodes);
                              if (allChecked) {
                                permsInCat.forEach((p) => next.delete(p.code));
                              } else {
                                permsInCat.forEach((p) => next.add(p.code));
                              }
                              setSelectedPermCodes(next);
                            }}
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          >
                            {allChecked ? 'Desmarcar todos' : 'Marcar todos'}
                          </button>
                        </div>
                      </div>

                      <div style={{ padding: '8px 14px' }}>
                        {permsInCat.map((perm) => {
                          const isChecked = selectedPermCodes.has(perm.code);
                          return (
                            <label
                              key={perm.code}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                padding: '8px 0',
                                borderBottom: '1px solid #f1f5f9',
                                cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.code)}
                                style={{ marginTop: '3px' }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{perm.name}</span>
                                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    {getRiskBadge(perm.risk_level)}
                                    {perm.future_phase_owner && (
                                      <span style={{ fontSize: '9px', backgroundColor: '#f1f5f9', color: '#64748b', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                        {perm.future_phase_owner}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0284c7' }}>{perm.code}</div>
                                {perm.description && (
                                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{perm.description}</div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: RESPONSIBILITIES MATRIX */}
          {activeSection === 'RESPONSIBILITIES' && (
            <div>
              <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '13px' }}>
                ✓ <strong>10 Perfiles Canónicos Logísticos Validados:</strong> Define el alcance funcional de cada rol sin asignación de permisos individuales directos en código (evaluación RBAC desacoplada por acción).
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                {matrixData?.canonical_profiles.map((p) => (
                  <div
                    key={p.role_code}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                        {p.role_code}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                        {p.operational_scope}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#0f172a' }}>{p.role_name}</h4>

                    <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600, marginBottom: '6px' }}>
                      Responsabilidades Funcionales:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
                      {p.responsibilities.map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: SOD MATRIX */}
          {activeSection === 'SOD' && (
            <div>
              <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', color: '#92400e', fontSize: '13px' }}>
                ⚖️ <strong>Matriz de Segregación de Funciones (SoD):</strong> Identifica incompatibilidades de control interno para prevenir fraude, manipulación de inventarios o conflictos de interés operativos.
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '12px 16px' }}>Rol A</th>
                      <th style={{ padding: '12px 16px' }}>Rol B</th>
                      <th style={{ padding: '12px 16px' }}>Nivel de Conflicto</th>
                      <th style={{ padding: '12px 16px' }}>Motivo de Incompatibilidad</th>
                      <th style={{ padding: '12px 16px' }}>Política de Segregación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixData?.sod_conflicts.map((conflict, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600, fontFamily: 'monospace', color: '#0f172a' }}>
                          {conflict.role_a}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600, fontFamily: 'monospace', color: '#0f172a' }}>
                          {conflict.role_b}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          {conflict.conflict_level === 'HIGH_RISK' ? (
                            <span style={{ fontSize: '11px', backgroundColor: '#fee2e2', color: '#991b1b', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                              ALTO RIESGO
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                              REVISIÓN REQUERIDA
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#334155' }}>
                          {conflict.reason}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#475569', fontStyle: 'italic' }}>
                          {conflict.policy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 5: ENDPOINT ↔ PERMISSION MATRIX */}
          {activeSection === 'ENDPOINT_MATRIX' && (
            <div>
              <div style={{ marginBottom: '16px', padding: '12px 16px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', color: '#1e40af', fontSize: '13px' }}>
                🔒 <strong>Matriz Canónica de Seguridad Endpoint ↔ Permiso:</strong> Define formalmente la acción requerida para cada operación REST en las fases F004, F005 y F006, lista para vinculación con sesión en F008.
              </div>

              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '12px 16px' }}>Método</th>
                      <th style={{ padding: '12px 16px' }}>Ruta REST</th>
                      <th style={{ padding: '12px 16px' }}>Permiso Requerido</th>
                      <th style={{ padding: '12px 16px' }}>Fase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpointMatrix.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor:
                                item.method === 'GET'
                                  ? '#e0f2fe'
                                  : item.method === 'POST'
                                  ? '#dcfce7'
                                  : item.method === 'PATCH' || item.method === 'PUT'
                                  ? '#fef3c7'
                                  : '#fee2e2',
                              color:
                                item.method === 'GET'
                                  ? '#0369a1'
                                  : item.method === 'POST'
                                  ? '#15803d'
                                  : item.method === 'PATCH' || item.method === 'PUT'
                                  ? '#b45309'
                                  : '#b91c1c',
                            }}
                          >
                            {item.method}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#0f172a' }}>
                          {item.endpoint}
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#2563eb' }}>
                          {item.required_permission}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748b' }}>
                          <span style={{ fontSize: '11px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                            {item.phase}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal - Create Role */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', width: '460px', maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Nuevo Rol Personalizado</h3>
            <form onSubmit={handleCreateRole}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Código *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. QUALITY_AUDITOR"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Nombre *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Auditor de Calidad"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Descripción</label>
                <textarea
                  rows={3}
                  placeholder="Descripción de responsabilidades y permisos..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Organización (Opcional)</label>
                <select
                  value={newOrgId}
                  onChange={(e) => setNewOrgId(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                >
                  <option value="">-- Rol Global (Todas las organizaciones) --</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.code})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="newIsTest"
                  checked={newIsTest}
                  onChange={(e) => setNewIsTest(e.target.checked)}
                />
                <label htmlFor="newIsTest" style={{ fontSize: '13px', color: '#475569' }}>Es dato sintético / prueba (Demo)</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Guardar Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Edit Role */}
      {editingRole && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', width: '460px', maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Editar Rol: {editingRole.code}</h3>
            <form onSubmit={handleUpdateRole}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Nombre *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px', fontWeight: 500 }}>Descripción</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                />
                <label htmlFor="editIsActive" style={{ fontSize: '13px', color: '#475569' }}>Rol activo</label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
