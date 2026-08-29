import React, { useEffect, useState, useCallback } from "react";
import { AuthUser, authApi, UserCreateInput } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { RoleResponse, rolesApi } from "../api/roles";
import { ApiError } from "../api/client";
import { StepUpDialog, StepUpChallengeInfo } from "../components/StepUpDialog";

export const UsersPage: React.FC = () => {
  const { hasPermission, organizationId } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Step-Up Dialog State
  const [stepUpChallenge, setStepUpChallenge] = useState<StepUpChallengeInfo | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

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
        setErrorMsg("Error de conexión al cargar usuarios.");
      }
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      if (err instanceof ApiError && err.status === 428 && err.code === "STEP_UP_REQUIRED" && err.details) {
        setStepUpChallenge({
          challengeId: String(err.details.challenge_id),
          policy: String(err.details.policy),
          reason: String(err.details.reason),
          expiresAt: String(err.details.expires_at),
        });
        setPendingAction(() => () => handleCreateUser());
        return;
      }
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
      if (err instanceof ApiError && err.status === 428 && err.code === "STEP_UP_REQUIRED" && err.details) {
        setStepUpChallenge({
          challengeId: String(err.details.challenge_id),
          policy: String(err.details.policy),
          reason: String(err.details.reason),
          expiresAt: String(err.details.expires_at),
        });
        setPendingAction(() => () => handleDisableUser(user));
        return;
      }
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
      if (err instanceof ApiError && err.status === 428 && err.code === "STEP_UP_REQUIRED" && err.details) {
        setStepUpChallenge({
          challengeId: String(err.details.challenge_id),
          policy: String(err.details.policy),
          reason: String(err.details.reason),
          expiresAt: String(err.details.expires_at),
        });
        setPendingAction(() => () => handleSaveUserRoles());
        return;
      }
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
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#f8fafc", margin: "0 0 0.5rem 0" }}>
            Administración de Usuarios e Identidad Real
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>
            Gestión de identidades con asignación de roles RBAC y control de acceso seguro.
          </p>
        </div>
        {hasPermission("users.create") && (
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>➕</span> Nuevo Usuario
          </button>
        )}
      </div>

      {errorMsg && (
        <div
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #ef4444",
            color: "#fca5a5",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.15)",
            border: "1px solid #22c55e",
            color: "#86efac",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          {successMsg}
        </div>
      )}

      {/* Users Table */}
      <div
        style={{
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "0.75rem",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "#0f172a", borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: "0.85rem" }}>
              <th style={{ padding: "1rem" }}>USUARIO</th>
              <th style={{ padding: "1rem" }}>EMAIL</th>
              <th style={{ padding: "1rem" }}>ROLES ASIGNADOS</th>
              <th style={{ padding: "1rem" }}>ESTADO</th>
              <th style={{ padding: "1rem", textAlign: "right" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                  Cargando usuarios...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
                  No se encontraron usuarios en la organización.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: "1px solid #334155",
                    color: "#f8fafc",
                    fontSize: "0.9rem",
                  }}
                >
                  <td style={{ padding: "1rem", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>👤</span>
                      <span>{u.display_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "1rem", color: "#cbd5e1" }}>{u.email}</td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                      {u.roles && u.roles.length > 0 ? (
                        u.roles.map((r) => (
                          <span
                            key={r}
                            style={{
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.25rem",
                              backgroundColor: "#334155",
                              color: "#38bdf8",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            {r}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Sin roles</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: u.is_active ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: u.is_active ? "#4ade80" : "#f87171",
                        border: `1px solid ${u.is_active ? "#22c55e" : "#ef4444"}`,
                      }}
                    >
                      {u.is_active ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      {hasPermission("users.roles.assign") && (
                        <button
                          onClick={() => handleOpenRolesModal(u)}
                          style={{
                            padding: "0.35rem 0.75rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #475569",
                            backgroundColor: "#334155",
                            color: "#f8fafc",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          Asignar Roles
                        </button>
                      )}
                      {hasPermission("users.disable") && u.is_active && (
                        <button
                          onClick={() => handleDisableUser(u)}
                          style={{
                            padding: "0.35rem 0.75rem",
                            borderRadius: "0.375rem",
                            border: "1px solid #ef4444",
                            backgroundColor: "transparent",
                            color: "#fca5a5",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "1rem",
              maxWidth: "500px",
              width: "100%",
              padding: "2rem",
              color: "#f8fafc",
            }}
          >
            <form onSubmit={handleCreateUser}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.25rem" }}>Crear Nuevo Usuario</h3>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.35rem" }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #475569",
                    backgroundColor: "#0f172a",
                    color: "#f8fafc",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.35rem" }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="usuario@logistica.local"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #475569",
                    backgroundColor: "#0f172a",
                    color: "#f8fafc",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.35rem" }}>
                  Contraseña Inicial (mínimo 12 caracteres)
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Contraseña robusta"
                  style={{
                    width: "100%",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #475569",
                    backgroundColor: "#0f172a",
                    color: "#f8fafc",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                  Asignar Roles Iniciales:
                </label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {availableRoles.map((r) => {
                    const isSelected = selectedRoleCodes.includes(r.code);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRoleSelection(r.code)}
                        style={{
                          padding: "0.35rem 0.75rem",
                          borderRadius: "0.375rem",
                          border: isSelected ? "1px solid #3b82f6" : "1px solid #475569",
                          backgroundColor: isSelected ? "#2563eb" : "#0f172a",
                          color: isSelected ? "#ffffff" : "#94a3b8",
                          fontSize: "0.8rem",
                          cursor: "pointer",
                        }}
                      >
                        {r.name} ({r.code})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #475569",
                    backgroundColor: "transparent",
                    color: "#cbd5e1",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {submitting ? "Creando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Roles Modal */}
      {showRolesModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem",
          }}
        >
          <div
            style={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "1rem",
              maxWidth: "500px",
              width: "100%",
              padding: "2rem",
              color: "#f8fafc",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>
              Asignar Roles a {selectedUser.display_name}
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Email: {selectedUser.email}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {availableRoles.map((r) => {
                const isSelected = selectedRoleCodes.includes(r.code);
                return (
                  <label
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.375rem",
                      backgroundColor: isSelected ? "rgba(37, 99, 235, 0.15)" : "#0f172a",
                      border: isSelected ? "1px solid #2563eb" : "1px solid #334155",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRoleSelection(r.code)}
                    />
                    <div>
                      <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f8fafc" }}>
                        {r.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginLeft: "0.5rem" }}>
                        ({r.code})
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setShowRolesModal(false)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #475569",
                  backgroundColor: "transparent",
                  color: "#cbd5e1",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveUserRoles}
                disabled={submitting}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "0.375rem",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {submitting ? "Guardando..." : "Guardar Roles"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step-Up Dialog */}
      <StepUpDialog
        isOpen={!!stepUpChallenge}
        challenge={stepUpChallenge}
        onSuccess={async () => {
          setStepUpChallenge(null);
          if (pendingAction) {
            await pendingAction();
            setPendingAction(null);
          }
        }}
        onCancel={() => {
          setStepUpChallenge(null);
          setPendingAction(null);
        }}
      />
    </div>
  );
};
