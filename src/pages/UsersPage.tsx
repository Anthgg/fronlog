import React, { useEffect, useState, useCallback } from "react";
import { AuthUser, authApi, UserCreateInput } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { RoleResponse, rolesApi } from "../api/roles";
import { ApiError } from "../api/client";

export const UsersPage: React.FC = () => {
  const { hasPermission, organizationId } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showRolesModal, setShowRolesModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);

  // Form states
  const [newEmail, setNewEmail] = useState<string>("");
  const [newDisplayName, setNewDisplayName] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [selectedRoleCodes, setSelectedRoleCodes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [usersData, rolesData] = await Promise.all([
        authApi.listUsers(),
        hasPermission("roles.read") ? rolesApi.listRoles() : Promise.resolve([]),
      ]);
      setUsers(usersData);
      setAvailableRoles(rolesData);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Error al cargar datos de usuarios.");
      }
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) {
      setErrorMsg("No se detectó la organización activa.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const input: UserCreateInput = {
        organization_id: organizationId,
        email: newEmail.trim(),
        display_name: newDisplayName.trim(),
        initial_password: newPassword,
        role_codes: selectedRoleCodes,
        is_test_data: false,
      };
      await authApi.createUser(input);
      setSuccessMsg(`Usuario ${newEmail} creado exitosamente.`);
      setShowCreateModal(false);
      setNewEmail("");
      setNewDisplayName("");
      setNewPassword("");
      setSelectedRoleCodes([]);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Error al crear usuario.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisableUser = async (user: AuthUser) => {
    if (!window.confirm(`¿Está seguro de desactivar a ${user.display_name} (${user.email})? Sus sesiones activas serán revocadas.`)) {
      return;
    }
    try {
      await authApi.disableUser(user.id);
      setSuccessMsg(`Usuario ${user.email} desactivado.`);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Error al desactivar usuario.");
      }
    }
  };

  const handleOpenRolesModal = (user: AuthUser) => {
    setSelectedUser(user);
    setSelectedRoleCodes(user.roles || []);
    setShowRolesModal(true);
  };

  const handleSaveUserRoles = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await authApi.assignUserRoles(selectedUser.id, {
        role_codes: selectedRoleCodes,
      });
      setSuccessMsg(`Roles actualizados para ${selectedUser.email}.`);
      setShowRolesModal(false);
      setSelectedUser(null);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Error al asignar roles.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRoleSelection = (roleCode: string) => {
    if (selectedRoleCodes.includes(roleCode)) {
      setSelectedRoleCodes(selectedRoleCodes.filter((c) => c !== roleCode));
    } else {
      setSelectedRoleCodes([...selectedRoleCodes, roleCode]);
    }
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Title & Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Administración de Usuarios
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
            Gestión centralizada de identidades, roles asignados y estado de cuenta
          </p>
        </div>

        {hasPermission("users.create") && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Crear Usuario
          </button>
        )}
      </div>

      {/* Messages */}
      {errorMsg && (
        <div style={{ padding: "0.75rem", backgroundColor: "#fee2e2", border: "1px solid #f87171", borderRadius: "0.375rem", color: "#b91c1c", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ padding: "0.75rem", backgroundColor: "#dcfce7", border: "1px solid #4ade80", borderRadius: "0.375rem", color: "#15803d", fontSize: "0.875rem", marginBottom: "1rem" }}>
          {successMsg}
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Cargando usuarios...</div>
        ) : users.length === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>No se encontraron usuarios en la organización.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Usuario</th>
                <th style={{ padding: "0.75rem 1rem" }}>Roles Asignados</th>
                <th style={{ padding: "0.75rem 1rem" }}>Estado</th>
                <th style={{ padding: "0.75rem 1rem" }}>Último Acceso</th>
                <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{u.display_name}</div>
                    <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                      {u.roles && u.roles.length > 0 ? (
                        u.roles.map((r) => (
                          <span
                            key={r}
                            style={{
                              display: "inline-block",
                              padding: "0.125rem 0.5rem",
                              backgroundColor: "#e0f2fe",
                              color: "#0369a1",
                              borderRadius: "9999px",
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                            }}
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Sin roles</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.125rem 0.5rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: u.is_active ? "#dcfce7" : "#fee2e2",
                        color: u.is_active ? "#15803d" : "#b91c1c",
                      }}
                    >
                      {u.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "#64748b", fontSize: "0.8125rem" }}>
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : "Nunca"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                      {hasPermission("users.roles.assign") && u.is_active && (
                        <button
                          onClick={() => handleOpenRolesModal(u)}
                          style={{
                            padding: "0.25rem 0.625rem",
                            backgroundColor: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "#334155",
                            cursor: "pointer",
                          }}
                        >
                          Roles
                        </button>
                      )}
                      {hasPermission("users.disable") && u.is_active && (
                        <button
                          onClick={() => handleDisableUser(u)}
                          style={{
                            padding: "0.25rem 0.625rem",
                            backgroundColor: "#fee2e2",
                            border: "1px solid #fca5a5",
                            borderRadius: "0.25rem",
                            fontSize: "0.75rem",
                            fontWeight: 500,
                            color: "#b91c1c",
                            cursor: "pointer",
                          }}
                        >
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create User */}
      {showCreateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", width: "100%", maxWidth: "480px", padding: "1.5rem", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 1rem 0", color: "#0f172a" }}>Crear Nuevo Usuario</h2>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>Nombre Completo</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  required
                  placeholder="Ej: Juan Pérez"
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: "0.375rem", fontSize: "0.875rem", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>Correo Electrónico</label>
                <input
                  type="text"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="usuario@logistica.local"
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: "0.375rem", fontSize: "0.875rem", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>Contraseña Inicial (Mínimo 12 caracteres)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={12}
                  placeholder="••••••••••••"
                  style={{ width: "100%", padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: "0.375rem", fontSize: "0.875rem", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.375rem" }}>Roles Iniciales</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem", maxHeight: "140px", overflowY: "auto", border: "1px solid #e2e8f0", padding: "0.5rem", borderRadius: "0.375rem" }}>
                  {availableRoles.map((r) => (
                    <label key={r.id} style={{ display: "flex", alignItems: "center", fontSize: "0.75rem", color: "#334155", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedRoleCodes.includes(r.code)}
                        onChange={() => toggleRoleSelection(r.code)}
                        style={{ marginRight: "0.375rem" }}
                      />
                      {r.code}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "0.5rem 0.875rem", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "0.375rem", fontSize: "0.875rem", cursor: "pointer" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "0.5rem 0.875rem", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  {submitting ? "Guardando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Roles */}
      {showRolesModal && selectedUser && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "0.5rem", width: "100%", maxWidth: "420px", padding: "1.5rem", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, margin: "0 0 0.5rem 0", color: "#0f172a" }}>Asignar Roles</h2>
            <p style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: "1rem" }}>
              {selectedUser.display_name} ({selectedUser.email})
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", maxHeight: "200px", overflowY: "auto", border: "1px solid #e2e8f0", padding: "0.5rem", borderRadius: "0.375rem", marginBottom: "1rem" }}>
              {availableRoles.map((r) => (
                <label key={r.id} style={{ display: "flex", alignItems: "center", fontSize: "0.75rem", color: "#334155", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedRoleCodes.includes(r.code)}
                    onChange={() => toggleRoleSelection(r.code)}
                    style={{ marginRight: "0.375rem" }}
                  />
                  {r.code}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => { setShowRolesModal(false); setSelectedUser(null); }}
                style={{ padding: "0.5rem 0.875rem", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "0.375rem", fontSize: "0.875rem", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSaveUserRoles}
                style={{ padding: "0.5rem 0.875rem", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? "Guardando..." : "Guardar Roles"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
