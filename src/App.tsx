import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { StructurePage } from "./pages/StructurePage";
import { RolesPage } from "./pages/RolesPage";
import { AuditPage } from "./pages/AuditPage";
import { UsersPage } from "./pages/UsersPage";
import { SecurityPage } from "./pages/SecurityPage";
import { SystemStatusPage } from "./pages/SystemStatusPage";
import { DocumentCatalogPage } from "./pages/DocumentCatalogPage";
import { DocumentNumberingPage } from "./pages/DocumentNumberingPage";

type TabType = "structure" | "roles" | "audit" | "users" | "documents" | "numbering" | "security" | "system";

const AppContent: React.FC = () => {
  const { user, roles, isAuthenticated, isLoading, mfaEnabled, logout, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("documents");

  // Adjust default active tab based on user permissions
  useEffect(() => {
    if (isAuthenticated) {
      if (hasPermission("document_catalog.read")) {
        setActiveTab("documents");
      } else if (hasPermission("organization.read")) {
        setActiveTab("structure");
      } else if (hasPermission("audit.read")) {
        setActiveTab("audit");
      } else if (hasPermission("roles.read")) {
        setActiveTab("roles");
      } else if (hasPermission("users.read")) {
        setActiveTab("users");
      } else {
        setActiveTab("security");
      }
    }
  }, [isAuthenticated, hasPermission]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          color: "#94a3b8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📦</div>
          <div>Iniciando sesión segura...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#f8fafc",
      }}
    >
      {/* Top Navigation Bar */}
      <header
        style={{
          backgroundColor: "#0f172a",
          color: "#ffffff",
          padding: "0 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: "60px",
          borderBottom: "1px solid #1e293b",
        }}
      >
        {/* Brand & Phase Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>📦</span>
          <span style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.025em" }}>
            Sistema Logístico Integral
          </span>
          <span
            style={{
              fontSize: "11px",
              backgroundColor: "#1e293b",
              color: "#38bdf8",
              padding: "2px 8px",
              borderRadius: "12px",
              border: "1px solid #0284c7",
              fontWeight: 600,
            }}
          >
            Fase 012
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: "flex", gap: "6px" }}>
          {hasPermission("document_catalog.read") && (
            <button
              onClick={() => setActiveTab("documents")}
              style={{
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: 500,
                backgroundColor: activeTab === "documents" ? "#2563eb" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              📄 Catálogo Documental
            </button>
          )}

          {hasPermission("document_catalog.read") && (
            <button
              onClick={() => setActiveTab("numbering")}
              style={{
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: 500,
                backgroundColor: activeTab === "numbering" ? "#2563eb" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              🔢 Numeración
            </button>
          )}

          {hasPermission("organization.read") && (
            <button
              onClick={() => setActiveTab("structure")}
              style={{
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: 500,
                backgroundColor: activeTab === "structure" ? "#2563eb" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              🏢 Estructura & Almacenes
            </button>
          )}

          {hasPermission("roles.read") && (
            <button
              onClick={() => setActiveTab("roles")}
              style={{
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: 500,
                backgroundColor: activeTab === "roles" ? "#2563eb" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              🛡️ Roles & RBAC
            </button>
          )}

          {hasPermission("audit.read") && (
            <button
              onClick={() => setActiveTab("audit")}
              style={{
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: 500,
                backgroundColor: activeTab === "audit" ? "#2563eb" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              📜 Auditoría
            </button>
          )}

          {hasPermission("users.read") && (
            <button
              onClick={() => setActiveTab("users")}
              style={{
                padding: "8px 12px",
                fontSize: "13px",
                fontWeight: 500,
                backgroundColor: activeTab === "users" ? "#2563eb" : "transparent",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              👥 Usuarios
            </button>
          )}

          <button
            onClick={() => setActiveTab("security")}
            style={{
              padding: "8px 12px",
              fontSize: "13px",
              fontWeight: 500,
              backgroundColor: activeTab === "security" ? "#2563eb" : "transparent",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🔒 Seguridad</span>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: mfaEnabled ? "#22c55e" : "#eab308",
              }}
            />
          </button>

          <button
            onClick={() => setActiveTab("system")}
            style={{
              padding: "8px 12px",
              fontSize: "13px",
              fontWeight: 500,
              backgroundColor: activeTab === "system" ? "#2563eb" : "transparent",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ⚙️ Estado
          </button>
        </nav>

        {/* User Profile & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc" }}>
              {user?.display_name}
            </div>
            <div style={{ fontSize: "11px", color: "#93c5fd" }}>
              {roles.join(", ") || "Sin roles"}
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "#334155",
              color: "#f8fafc",
              border: "1px solid #475569",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ padding: "8px 24px" }}>
        {activeTab === "documents" && <DocumentCatalogPage />}
        {activeTab === "numbering" && <DocumentNumberingPage />}
        {activeTab === "structure" && <StructurePage />}
        {activeTab === "roles" && <RolesPage />}
        {activeTab === "audit" && <AuditPage />}
        {activeTab === "users" && <UsersPage />}
        {activeTab === "security" && <SecurityPage />}
        {activeTab === "system" && <SystemStatusPage />}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
