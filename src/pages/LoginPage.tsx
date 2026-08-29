import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Por favor ingrese correo electrónico y contraseña.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await login(email, password);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.code === "INVALID_CREDENTIALS") {
          setErrorMsg("Credenciales inválidas. Verifique su correo o contraseña.");
        } else {
          setErrorMsg(err.message || "Error al iniciar sesión.");
        }
      } else {
        setErrorMsg("Error de conexión con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("DemoLogistics2026!Secure");
    setErrorMsg(null);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0f172a",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: "1rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        backgroundColor: "#1e293b",
        borderRadius: "0.75rem",
        border: "1px solid #334155",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)",
        padding: "2rem",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "48px",
            height: "48px",
            borderRadius: "0.5rem",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "0.75rem",
          }}>
            L
          </div>
          <h1 style={{ color: "#f8fafc", fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>
            Sistema Logístico Integral
          </h1>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Autenticación e Identidad Segura
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #ef4444",
            borderRadius: "0.375rem",
            padding: "0.75rem",
            color: "#fca5a5",
            fontSize: "0.8125rem",
            marginBottom: "1rem",
          }}>
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.375rem" }}>
              Correo Electrónico
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@logistica.local"
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                backgroundColor: "#0f172a",
                border: "1px solid #475569",
                borderRadius: "0.375rem",
                color: "#f8fafc",
                fontSize: "0.875rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.375rem" }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                backgroundColor: "#0f172a",
                border: "1px solid #475569",
                borderRadius: "0.375rem",
                color: "#f8fafc",
                fontSize: "0.875rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.625rem 1rem",
              backgroundColor: loading ? "#475569" : "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.15s ease",
            }}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        {/* Demo Quick Fill Helper */}
        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid #334155" }}>
          <p style={{ color: "#64748b", fontSize: "0.75rem", textAlign: "center", marginBottom: "0.5rem" }}>
            Credenciales Demo (Entornos permitidos)
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => handleQuickFill("gerencia.demo@logistica.local")}
              style={{
                padding: "0.375rem 0.5rem",
                backgroundColor: "#334155",
                color: "#93c5fd",
                border: "1px solid #475569",
                borderRadius: "0.25rem",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Gerencia
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("almacen.demo@logistica.local")}
              style={{
                padding: "0.375rem 0.5rem",
                backgroundColor: "#334155",
                color: "#86efac",
                border: "1px solid #475569",
                borderRadius: "0.25rem",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Almacén
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("auditor.demo@logistica.local")}
              style={{
                padding: "0.375rem 0.5rem",
                backgroundColor: "#334155",
                color: "#fde047",
                border: "1px solid #475569",
                borderRadius: "0.25rem",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Auditor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
