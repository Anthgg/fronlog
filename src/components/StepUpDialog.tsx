import React, { useState } from "react";
import { mfaApi } from "../api/mfa";
import { ApiError } from "../api/client";

export interface StepUpChallengeInfo {
  challengeId: string;
  policy: string;
  reason?: string;
  methods?: string[];
  expiresAt?: string;
}

interface StepUpDialogProps {
  isOpen: boolean;
  challenge: StepUpChallengeInfo | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const StepUpDialog: React.FC<StepUpDialogProps> = ({
  isOpen,
  challenge,
  onSuccess,
  onCancel,
}) => {
  const [method, setMethod] = useState<"TOTP" | "RECOVERY_CODE">("TOTP");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !challenge) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setErrorMsg("Ingrese el código de verificación.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await mfaApi.verifyStepUp(challenge.challengeId, method, code.trim());
      setCode("");
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === "TOTP_REPLAY_DETECTED") {
          setErrorMsg("Código TOTP ya utilizado. Espere el siguiente ciclo de 30 segundos.");
        } else if (err.code === "CHALLENGE_LOCKED") {
          setErrorMsg("Desafío bloqueado por exceder el límite de intentos permitidos.");
        } else if (err.code === "CHALLENGE_EXPIRED") {
          setErrorMsg("El tiempo límite para verificar la operación ha expirado.");
        } else {
          setErrorMsg(err.message || "Código de verificación inválido.");
        }
      } else {
        setErrorMsg("Error de conexión al verificar Step-Up.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
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
          maxWidth: "440px",
          width: "100%",
          padding: "1.75rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          color: "#f8fafc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.25rem",
            }}
          >
            🛡️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 600 }}>
              Verificación Requerida (Step-Up)
            </h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#94a3b8" }}>
              Acción sensible protegida por política de seguridad
            </p>
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#0f172a",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.25rem",
            fontSize: "0.85rem",
            color: "#cbd5e1",
            borderLeft: "3px solid #3b82f6",
          }}
        >
          Para autorizar esta operación, ingresa el código de tu autenticador o un código de recuperación.
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              color: "#fca5a5",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.85rem",
              marginBottom: "1rem",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Method Selector Tabs */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#0f172a",
            padding: "0.25rem",
            borderRadius: "0.5rem",
            marginBottom: "1.25rem",
            gap: "0.25rem",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMethod("TOTP");
              setCode("");
              setErrorMsg(null);
            }}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
              backgroundColor: method === "TOTP" ? "#3b82f6" : "transparent",
              color: method === "TOTP" ? "#ffffff" : "#94a3b8",
              transition: "all 0.2s",
            }}
          >
            App Autenticador
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod("RECOVERY_CODE");
              setCode("");
              setErrorMsg(null);
            }}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "0.375rem",
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
              backgroundColor: method === "RECOVERY_CODE" ? "#3b82f6" : "transparent",
              color: method === "RECOVERY_CODE" ? "#ffffff" : "#94a3b8",
              transition: "all 0.2s",
            }}
          >
            Código Recuperación
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                color: "#94a3b8",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              {method === "TOTP"
                ? "Código TOTP (6 dígitos):"
                : "Código de Recuperación (10 caracteres):"}
            </label>
            <input
              type="text"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={method === "TOTP" ? "123456" : "ABCD-EFGH"}
              maxLength={method === "TOTP" ? 8 : 20}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #475569",
                backgroundColor: "#0f172a",
                color: "#f8fafc",
                fontSize: "1.25rem",
                letterSpacing: "0.2em",
                textAlign: "center",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                border: "1px solid #475569",
                backgroundColor: "transparent",
                color: "#cbd5e1",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "0.9rem",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              style={{
                padding: "0.625rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: loading ? "#2563eb80" : "#2563eb",
                color: "#ffffff",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "0.9rem",
              }}
            >
              {loading ? "Verificando..." : "Confirmar y Continuar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
