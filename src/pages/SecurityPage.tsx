import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { mfaApi, MfaStatusResponse, MfaTotpEnrollResponse } from "../api/mfa";
import { ApiError } from "../api/client";
import "./AdminModules.css";

export const SecurityPage: React.FC = () => {
  const { user, refreshMfaStatus } = useAuth();

  const [status, setStatus] = useState<MfaStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Enrollment State
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollStep, setEnrollStep] = useState<1 | 2 | 3>(1);
  const [currentPassword, setCurrentPassword] = useState("");
  const [enrollData, setEnrollData] = useState<MfaTotpEnrollResponse | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [savedAcknowledged, setSavedAcknowledged] = useState(false);

  // Disable MFA State
  const [isDisabling, setIsDisabling] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");

  // Regenerate Codes State
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenCodes, setRegenCodes] = useState<string[] | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await mfaApi.getStatus();
      setStatus(data);
    } catch {
      setErrorMsg("Error al obtener el estado de seguridad MFA.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStartEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await mfaApi.enrollTotp(currentPassword);
      setEnrollData(res);
      setEnrollStep(2);
      setCurrentPassword("");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Contraseña actual incorrecta.");
      } else {
        setErrorMsg("Error al iniciar enrolamiento MFA.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData || !totpCode.trim()) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await mfaApi.confirmTotp(enrollData.enrollment_id, totpCode.trim());
      setRecoveryCodes(res.recovery_codes);
      setEnrollStep(3);
      setTotpCode("");
      await fetchStatus();
      await refreshMfaStatus();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Código TOTP inválido.");
      } else {
        setErrorMsg("Error al confirmar el código TOTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinishEnroll = () => {
    setIsEnrolling(false);
    setEnrollStep(1);
    setEnrollData(null);
    setRecoveryCodes([]);
    setSavedAcknowledged(false);
    setSuccessMsg("¡Autenticación multifactor activada con éxito!");
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await mfaApi.disableMfa(disablePassword);
      setIsDisabling(false);
      setDisablePassword("");
      setSuccessMsg("Autenticación multifactor desactivada.");
      await fetchStatus();
      await refreshMfaStatus();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message || "Contraseña incorrecta.");
      } else {
        setErrorMsg("Error al desactivar MFA.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCodes = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await mfaApi.regenerateRecoveryCodes();
      setRegenCodes(res.recovery_codes);
      setIsRegenerating(true);
      await fetchStatus();
    } catch {
      setErrorMsg("Error al regenerar códigos de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  return (
    <section className="admin-page admin-security-card" aria-labelledby="security-title">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header__copy">
        <span className="admin-header__eyebrow">Protección de la cuenta</span>
        <h1 id="security-title">Seguridad y doble factor</h1>
        <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>
          Administra los factores de autenticación multifactor (RFC 6238) y la protección para acciones críticas.
        </p>
        </div>
      </header>

      {errorMsg && (
        <div
          className="admin-alert admin-alert--error"
          role="alert"
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
          className="admin-alert admin-alert--success"
          role="status"
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

      {/* Main Status Card */}
      <div
        className="admin-status-card"
        style={{
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div className="admin-security-summary" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div className="admin-security-summary__identity" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              className="admin-security-indicator"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "0.75rem",
                backgroundColor: status?.enabled ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                color: status?.enabled ? "#22c55e" : "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
              }}
            >
              <span>{status?.enabled ? "Activado" : "Inactivo"}</span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#f8fafc" }}>
                Autenticador TOTP (Google Authenticator / Authy)
              </h3>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                Usuario: <strong>{user?.email}</strong>
              </p>
            </div>
          </div>
          <span
            className={`admin-badge ${status?.enabled ? "admin-badge--success" : "admin-badge--danger"}`}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "9999px",
              fontSize: "0.8rem",
              fontWeight: 600,
              backgroundColor: status?.enabled ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
              color: status?.enabled ? "#4ade80" : "#f87171",
              border: `1px solid ${status?.enabled ? "#22c55e" : "#ef4444"}`,
            }}
          >
            {status?.enabled ? "ACTIVADO" : "INACTIVO"}
          </span>
        </div>

        {status?.enabled ? (
          <div>
            <div
              style={{
                backgroundColor: "#0f172a",
                borderRadius: "0.5rem",
                padding: "1rem",
                marginBottom: "1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontSize: "0.9rem", color: "#cbd5e1", display: "block" }}>
                  Códigos de recuperación de un solo uso
                </span>
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  Disponibles: <strong>{status.recovery_codes_remaining} de 8</strong>
                </span>
              </div>
              <button
                className="admin-button--danger"
                type="button"
                onClick={handleRegenerateCodes}
                disabled={loading}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #475569",
                  backgroundColor: "transparent",
                  color: "#cbd5e1",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                Regenerar Códigos
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setIsDisabling(true)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #ef4444",
                  backgroundColor: "transparent",
                  color: "#fca5a5",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                Desactivar MFA
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: "#cbd5e1", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "1.5rem" }}>
              Protege tu cuenta agregando un segundo factor de autenticación basado en tiempo (TOTP). Al activarlo,
              todas las operaciones sensibles requerirán verificación de seguridad (Step-Up).
            </p>
            <button
              className="admin-button--primary"
              type="button"
              onClick={() => {
                setIsEnrolling(true);
                setEnrollStep(1);
              }}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              Configurar Autenticador TOTP
            </button>
          </div>
        )}
      </div>

      {/* Enrollment Wizard Modal */}
      {isEnrolling && (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mfa-enrollment-title"
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
            className="admin-modal__panel"
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
            {/* Step 1: Re-authenticate */}
            {enrollStep === 1 && (
              <form onSubmit={handleStartEnroll}>
                <h3 id="mfa-enrollment-title" style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>Confirmar identidad</h3>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                  Ingresa tu contraseña actual para iniciar la configuración de MFA.
                </p>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
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

                <div className="admin-form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsEnrolling(false)}
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
                    className="admin-button--primary"
                    type="submit"
                    disabled={loading || !currentPassword}
                    style={{
                      padding: "0.5rem 1.25rem",
                      borderRadius: "0.375rem",
                      border: "none",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {loading ? "Verificando..." : "Continuar"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Scan QR & Verify OTP */}
            {enrollStep === 2 && enrollData && (
              <form onSubmit={handleConfirmTotp}>
                <h3 id="mfa-enrollment-title" style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>Escanear código QR</h3>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  Abre tu aplicación de autenticación (Google Authenticator, Authy) y escanea la imagen:
                </p>

                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <img
                      src={mfaApi.getQrUrl(enrollData.qr_endpoint)}
                      alt="TOTP QR Code"
                      style={{ width: "180px", height: "180px", display: "block" }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#0f172a",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    marginBottom: "1.25rem",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", display: "block", marginBottom: "0.25rem" }}>
                    Clave manual:
                  </span>
                  <code style={{ fontSize: "0.9rem", color: "#38bdf8", letterSpacing: "0.1em", fontWeight: 600 }}>
                    {enrollData.manual_key}
                  </code>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                    Ingresa el código de 6 dígitos que muestra tu app:
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="123456"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #475569",
                      backgroundColor: "#0f172a",
                      color: "#f8fafc",
                      fontSize: "1.25rem",
                      textAlign: "center",
                      letterSpacing: "0.25em",
                      fontWeight: 600,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div className="admin-form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    type="button"
                    onClick={() => setIsEnrolling(false)}
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
                    className="admin-button--primary"
                    type="submit"
                    disabled={loading || totpCode.length < 6}
                    style={{
                      padding: "0.5rem 1.25rem",
                      borderRadius: "0.375rem",
                      border: "none",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      cursor: loading || totpCode.length < 6 ? "not-allowed" : "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {loading ? "Validando..." : "Confirmar y Activar"}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: One-Time Recovery Codes */}
            {enrollStep === 3 && (
              <div>
                <h3 id="mfa-enrollment-title" style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem", color: "#4ade80" }}>
                  MFA configurado correctamente
                </h3>
                <p style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "1rem" }}>
                  Guarda estos <strong>8 códigos de recuperación de un solo uso</strong> en un lugar seguro. Si pierdes el
                  acceso a tu autenticador, solo podrás ingresar usando uno de estos códigos.
                </p>

                <div
                  className="admin-recovery-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                    backgroundColor: "#0f172a",
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  {recoveryCodes.map((code, idx) => (
                    <code
                      key={idx}
                      style={{
                        padding: "0.35rem 0.5rem",
                        backgroundColor: "#1e293b",
                        borderRadius: "0.25rem",
                        color: "#f8fafc",
                        fontSize: "0.9rem",
                        textAlign: "center",
                        fontWeight: 600,
                      }}
                    >
                      {code}
                    </code>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(recoveryCodes)}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #475569",
                      backgroundColor: "#334155",
                      color: "#f8fafc",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    {copiedCodes ? "Copiados al portapapeles" : "Copiar todos los códigos"}
                  </button>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    color: "#94a3b8",
                    marginBottom: "1.5rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={savedAcknowledged}
                    onChange={(e) => setSavedAcknowledged(e.target.checked)}
                  />
                  He guardado mis códigos de recuperación en un lugar seguro
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="admin-button--primary"
                    type="button"
                    disabled={!savedAcknowledged}
                    onClick={handleFinishEnroll}
                    style={{
                      padding: "0.625rem 1.5rem",
                      borderRadius: "0.375rem",
                      border: "none",
                      backgroundColor: savedAcknowledged ? "#22c55e" : "#22c55e80",
                      color: "#ffffff",
                      cursor: savedAcknowledged ? "pointer" : "not-allowed",
                      fontWeight: 600,
                    }}
                  >
                    Completar Configuración
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disable MFA Modal */}
      {isDisabling && (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="disable-mfa-title"
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
            className="admin-modal__panel"
            style={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "1rem",
              maxWidth: "440px",
              width: "100%",
              padding: "2rem",
              color: "#f8fafc",
            }}
          >
            <form onSubmit={handleDisableMfa}>
              <h3 id="disable-mfa-title" style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem", color: "#f87171" }}>
                Desactivar Doble Factor (MFA)
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                Ingresa tu contraseña para confirmar la desactivación del factor TOTP.
              </p>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "#cbd5e1", marginBottom: "0.5rem" }}>
                  Contraseña actual
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
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

              <div className="admin-form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setIsDisabling(false)}
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
                  className="admin-button--danger"
                  type="submit"
                  disabled={loading || !disablePassword}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "0.375rem",
                    border: "none",
                    backgroundColor: "#ef4444",
                    color: "#ffffff",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Desactivando..." : "Confirmar Desactivación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regenerated Codes Modal */}
      {isRegenerating && regenCodes && (
        <div
          className="admin-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recovery-codes-title"
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
            className="admin-modal__panel"
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
            <h3 id="recovery-codes-title" style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem" }}>
              Nuevos Códigos de Recuperación
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Los códigos anteriores han sido invalidados. Guarda estos nuevos códigos:
            </p>

            <div
              className="admin-recovery-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
                backgroundColor: "#0f172a",
                padding: "1rem",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              {regenCodes.map((code, idx) => (
                <code
                  key={idx}
                  style={{
                    padding: "0.35rem 0.5rem",
                    backgroundColor: "#1e293b",
                    borderRadius: "0.25rem",
                    color: "#f8fafc",
                    fontSize: "0.9rem",
                    textAlign: "center",
                    fontWeight: 600,
                  }}
                >
                  {code}
                </code>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => copyToClipboard(regenCodes)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #475569",
                  backgroundColor: "#334155",
                  color: "#f8fafc",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                {copiedCodes ? "Copiados" : "Copiar códigos"}
              </button>
              <button
                className="admin-button--primary"
                type="button"
                onClick={() => {
                  setIsRegenerating(false);
                  setRegenCodes(null);
                }}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "0.375rem",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
