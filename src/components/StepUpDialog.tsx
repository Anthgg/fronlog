import React, { useState } from "react";
import { mfaApi } from "../api/mfa";
import { ApiError } from "../api/client";
import "./StepUpDialog.css";

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
  onSuccess: (grantId?: string) => void;
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
      const verifyRes = await mfaApi.verifyStepUp(challenge.challengeId, method, code.trim());
      setCode("");
      onSuccess(verifyRes.grant_id);
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

  const selectMethod = (nextMethod: "TOTP" | "RECOVERY_CODE") => {
    setMethod(nextMethod);
    setCode("");
    setErrorMsg(null);
  };

  const fieldLabel =
    method === "TOTP"
      ? "Código TOTP de 6 dígitos"
      : "Código de recuperación de 10 caracteres";

  return (
    <div className="step-up__backdrop">
      <section
        className="step-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="step-up-title"
        aria-describedby="step-up-description"
      >
        <header className="step-up__header">
          <span className="step-up__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3 5.5 5.8v5.3c0 4.3 2.7 8.2 6.5 9.9 3.8-1.7 6.5-5.6 6.5-9.9V5.8L12 3Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="m9.2 12 1.8 1.8 3.9-4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <p className="step-up__eyebrow">Seguridad de la operación</p>
            <h2 id="step-up-title">Verificación requerida</h2>
          </div>
        </header>

        <p className="step-up__description" id="step-up-description">
          Para autorizar esta acción, ingresa el código de tu autenticador o un
          código de recuperación.
        </p>

        {errorMsg && (
          <div className="step-up__alert" id="step-up-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 8v4m0 4h.01M10.3 4.8 3.4 17a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="step-up__method" role="tablist" aria-label="Método de verificación">
          <button
            className={method === "TOTP" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={method === "TOTP"}
            onClick={() => selectMethod("TOTP")}
          >
            App autenticador
          </button>
          <button
            className={method === "RECOVERY_CODE" ? "is-active" : ""}
            type="button"
            role="tab"
            aria-selected={method === "RECOVERY_CODE"}
            onClick={() => selectMethod("RECOVERY_CODE")}
          >
            Código de recuperación
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="step-up__field">
            <label htmlFor="step-up-code">{fieldLabel}</label>
            <input
              id="step-up-code"
              type="text"
              inputMode={method === "TOTP" ? "numeric" : "text"}
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={method === "TOTP" ? "123456" : "ABCD-EFGH"}
              maxLength={method === "TOTP" ? 8 : 20}
              aria-invalid={Boolean(errorMsg)}
              aria-describedby={errorMsg ? "step-up-error" : undefined}
            />
          </div>

          <div className="step-up__actions">
            <button
              className="step-up__button step-up__button--secondary"
              type="button"
              disabled={loading}
              onClick={onCancel}
            >
              Cancelar
            </button>
            <button
              className="step-up__button step-up__button--primary"
              type="submit"
              disabled={loading || !code.trim()}
            >
              {loading ? "Verificando..." : "Confirmar y continuar"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
