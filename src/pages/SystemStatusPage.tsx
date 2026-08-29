import React, { useEffect, useState, useCallback } from "react";
import { getSystemInfo, SystemInfo, API_BASE_URL } from "../api/client";
import "./AdminModules.css";

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
    <section className="admin-page admin-status-shell" aria-labelledby="system-status-title">
      <div className="admin-status-card">
        <header className="admin-status-card__header">
          <div className="admin-header__copy">
            <span className="admin-header__eyebrow">Operación del sistema</span>
            <h1 id="system-status-title">Estado de infraestructura</h1>
            <p>Disponibilidad y configuración de la plataforma logística.</p>
          </div>
          <span
            className={`admin-badge ${
              loading
                ? "admin-badge--warning"
                : isConnected
                  ? "admin-badge--success"
                  : "admin-badge--danger"
            }`}
            aria-live="polite"
          >
            {loading ? "Verificando" : isConnected ? "Operativo" : "Sin conexión"}
          </span>
        </header>

        <div className="admin-status-grid">
          <div className="admin-status-row">
            <span>Backend</span>
            <span
              className={
                loading
                  ? "admin-status--loading"
                  : isConnected
                    ? "admin-status--ok"
                    : "admin-status--error"
              }
            >
              <i className="admin-status-dot" aria-hidden="true" />
              {loading ? "Verificando..." : isConnected ? "Conectado" : "No disponible"}
            </span>
          </div>

          <div className="admin-status-row">
            <span>API</span>
            <span>{loading ? "Verificando..." : (info?.api ?? "offline")}</span>
          </div>

          <div className="admin-status-row">
            <span>Entorno</span>
            <span>{loading ? "Verificando..." : (info?.environment ?? "unknown")}</span>
          </div>

          <div className="admin-status-row admin-status-row--wide">
            <span>URL del backend</span>
            <span><code>{API_BASE_URL}</code></span>
          </div>
        </div>

        {error && (
          <div className="admin-alert admin-alert--error" role="alert">
            <span>{error}</span>
          </div>
        )}

        <button
          className="admin-button--primary"
          type="button"
          onClick={fetchStatus}
          disabled={loading}
        >
          {loading ? "Comprobando conexión..." : "Actualizar estado"}
        </button>
      </div>
    </section>
  );
};
