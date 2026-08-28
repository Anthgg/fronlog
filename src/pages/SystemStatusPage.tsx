import React, { useEffect, useState, useCallback } from "react";
import { getSystemInfo, SystemInfo, API_BASE_URL } from "../api/client";

export const SystemStatusPage: React.FC = () => {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSystemInfo();
      setInfo(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error de conexion con el backend"
      );
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isConnected = info !== null && error === null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "540px",
          backgroundColor: "#1e293b",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          border: "1px solid #334155",
        }}
      >
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              margin: "0 0 8px 0",
              color: "#f8fafc",
            }}
          >
            Sistema Logístico Integral
          </h1>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#94a3b8" }}>
            Línea Base Técnica — Estado de Infraestructura
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              backgroundColor: "#0f172a",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
              Backend
            </span>
            <span
              style={{
                fontWeight: 600,
                fontSize: "0.875rem",
                color: loading
                  ? "#e2e8f0"
                  : isConnected
                    ? "#4ade80"
                    : "#f87171",
              }}
            >
              {loading
                ? "Verificando..."
                : isConnected
                  ? "Conectado"
                  : "No disponible"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              backgroundColor: "#0f172a",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>API</span>
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {loading ? "..." : (info?.api ?? "offline")}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              backgroundColor: "#0f172a",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
              Environment
            </span>
            <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
              {loading ? "..." : (info?.environment ?? "unknown")}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              backgroundColor: "#0f172a",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
              Backend URL
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.8125rem",
                color: "#cbd5e1",
              }}
            >
              {API_BASE_URL}
            </span>
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid #ef4444",
                borderRadius: "8px",
                color: "#fca5a5",
                fontSize: "0.8125rem",
              }}
            >
              {error}
            </div>
          )}
        </div>

        <button
          onClick={fetchStatus}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "background-color 0.2s",
          }}
        >
          {loading ? "Comprobando conexion..." : "Actualizar Estado"}
        </button>
      </div>
    </div>
  );
};
