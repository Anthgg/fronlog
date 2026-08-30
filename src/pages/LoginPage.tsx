import React, { useState } from "react";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

interface IconProps {
  className?: string;
}

const LogisticsMarkIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="M3 7.5V16l9 5 9-5V7.5M12 12v9" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <path d="m7.5 5.25 9 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const MailIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
  </svg>
);

const LockIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4" y="10" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const EyeIcon: React.FC<IconProps & { hidden: boolean }> = ({ className, hidden }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {hidden ? (
      <>
        <path d="M3 3 21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.4A10.7 10.7 0 0 1 12 4c5.5 0 9 5 9 5a16 16 0 0 1-2.2 2.7M6.2 6.2A17.5 17.5 0 0 0 3 9s3.5 5 9 5c1 0 2-.2 2.9-.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      <>
        <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      </>
    )}
  </svg>
);

const ArrowRightIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AlertIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
    <path d="M12 7.5v5M12 16.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      setErrorMsg("Por favor ingrese correo electrónico y contraseña.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setErrorMsg(
          error.code === "INVALID_CREDENTIALS"
            ? "Credenciales inválidas. Verifique su correo o contraseña."
            : error.message || "Error al iniciar sesión.",
        );
      } else {
        setErrorMsg("Error de conexión con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setErrorMsg(null);
  };

  return (
    <main className="login-page">
      <section className="login-shell" aria-labelledby="login-title">
        <aside className="login-context" aria-label="Información del sistema">
          <div className="login-brand">
            <span className="login-brand-mark" aria-hidden="true">
              <LogisticsMarkIcon className="login-brand-icon" />
            </span>
            <div>
              <strong>Nexus Logistics</strong>
              <span>Control operativo integral</span>
            </div>
          </div>

          <div className="login-context-copy">
            <span className="login-kicker">Plataforma empresarial</span>
            <h2>La operación logística, en un solo lugar.</h2>
            <p>Documentos, almacenes, usuarios y trazabilidad con una interfaz clara para el trabajo diario.</p>
          </div>

          <div className="login-context-meta">
            <span>Operación</span>
            <span>Control</span>
            <span>Trazabilidad</span>
          </div>
        </aside>

        <div className="login-panel">
          <header className="login-header">
            <span className="login-mobile-mark" aria-hidden="true">
              <LogisticsMarkIcon />
            </span>
            <p className="login-eyebrow">Acceso seguro</p>
            <h1 id="login-title">Iniciar sesión</h1>
            <p>Ingrese sus credenciales corporativas para continuar.</p>
          </header>

          {errorMsg && (
            <div id="login-error" className="login-alert" role="alert">
              <AlertIcon className="login-alert-icon" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label htmlFor="login-email">Correo electrónico</label>
              <div className="login-input-wrap">
                <MailIcon className="login-input-icon" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@logistica.local"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  autoFocus
                  required
                  disabled={loading}
                  aria-invalid={Boolean(errorMsg)}
                  aria-describedby={errorMsg ? "login-error" : undefined}
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Contraseña</label>
              <div className="login-input-wrap">
                <LockIcon className="login-input-icon" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  aria-invalid={Boolean(errorMsg)}
                  aria-describedby={errorMsg ? "login-error" : undefined}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>
            </div>

            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="login-spinner" aria-hidden="true" />
                  <span>Iniciando sesión…</span>
                </>
              ) : (
                <>
                  <span>Ingresar al sistema</span>
                  <ArrowRightIcon className="login-submit-icon" />
                </>
              )}
            </button>
          </form>

          <details className="login-demo">
            <summary>Accesos de demostración</summary>
            <p>Seleccione un perfil habilitado para completar el correo.</p>
            <div className="login-demo-grid">
              <button type="button" onClick={() => handleQuickFill("gerencia.demo@logistica.local")}>Gerencia</button>
              <button type="button" onClick={() => handleQuickFill("almacen.demo@logistica.local")}>Almacén</button>
              <button type="button" onClick={() => handleQuickFill("auditor.demo@logistica.local")}>Auditoría</button>
            </div>
          </details>

          <footer className="login-footer">
            <span>© 2026 Nexus Logistics</span>
            <span>Acceso restringido</span>
          </footer>
        </div>
      </section>
    </main>
  );
};
