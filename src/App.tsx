import React, { useEffect, useMemo, useRef, useState } from "react";
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
import DocumentSeriesPage from "./pages/DocumentSeriesPage";
import DocumentTemplatesPage from "./pages/DocumentTemplatesPage";
import "./App.css";

type TabType =
  | "structure"
  | "roles"
  | "audit"
  | "users"
  | "documents"
  | "numbering"
  | "series"
  | "templates"
  | "security"
  | "system";

type ShellIconName =
  | "brand"
  | "documents"
  | "numbering"
  | "series"
  | "templates"
  | "structure"
  | "roles"
  | "audit"
  | "users"
  | "security"
  | "system"
  | "menu"
  | "close"
  | "logout";

type PermissionCheck = (permissionCode: string) => boolean;

interface NavigationItem {
  id: TabType;
  label: string;
  icon: ShellIconName;
  isVisible: (hasPermission: PermissionCheck) => boolean;
}

interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

const NAVIGATION_SECTIONS: NavigationSection[] = [
  {
    label: "Documentos",
    items: [
      { id: "documents", label: "Catálogo documental", icon: "documents", isVisible: (can) => can("document_catalog.read") },
      { id: "numbering", label: "Numeración", icon: "numbering", isVisible: (can) => can("document_catalog.read") },
      {
        id: "series",
        label: "Series y talonarios",
        icon: "series",
        isVisible: (can) => can("document_series.read") || can("document_catalog.read"),
      },
      {
        id: "templates",
        label: "Plantillas y render",
        icon: "templates",
        isVisible: (can) => can("document_templates.read") || can("document_catalog.read"),
      },
    ],
  },
  {
    label: "Operación",
    items: [
      { id: "structure", label: "Estructura y almacenes", icon: "structure", isVisible: (can) => can("organization.read") },
    ],
  },
  {
    label: "Administración",
    items: [
      { id: "roles", label: "Roles y RBAC", icon: "roles", isVisible: (can) => can("roles.read") },
      { id: "audit", label: "Auditoría", icon: "audit", isVisible: (can) => can("audit.read") },
      { id: "users", label: "Usuarios", icon: "users", isVisible: (can) => can("users.read") },
    ],
  },
  {
    label: "Sistema",
    items: [
      { id: "security", label: "Seguridad", icon: "security", isVisible: () => true },
      { id: "system", label: "Estado del sistema", icon: "system", isVisible: () => true },
    ],
  },
];

interface ShellIconProps {
  name: ShellIconName;
  className?: string;
}

const ShellIcon: React.FC<ShellIconProps> = ({ name, className }) => {
  const commonProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
  };

  switch (name) {
    case "brand":
      return (
        <svg {...commonProps} viewBox="0 0 32 32">
          <path d="M18.7 5.2c3.1-1.8 6.2-2.2 8-2.1.1 1.8-.3 4.9-2.1 8l-5.8 9.7-7.4-7.4 7.3-8.2Z" />
          <path d="m18.8 20.8-1.4 5.1-3.5 3.1-.8-5.7M11.3 13.4l-5.2 1.4L3 18.3l5.7.8" />
          <circle cx="21.2" cy="8.7" r="2.1" />
          <path d="M10.3 21.7c-2.6 2.6-4.8 2.7-6.5 2.5-.2-1.7-.1-3.9 2.5-6.5" />
        </svg>
      );
    case "documents":
      return <svg {...commonProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></svg>;
    case "numbering":
      return <svg {...commonProps}><path d="M10 3 8 21M16 3l-2 18M4 9h16M3 15h16" /></svg>;
    case "series":
      return <svg {...commonProps}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></svg>;
    case "templates":
      return <svg {...commonProps}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9M13 13h4M13 17h4" /></svg>;
    case "structure":
      return <svg {...commonProps}><path d="M3 21V7l9-4 9 4v14M3 11h18M7 15h2M15 15h2M7 19h2M15 19h2" /></svg>;
    case "roles":
      return <svg {...commonProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "audit":
      return <svg {...commonProps}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>;
    case "users":
      return <svg {...commonProps}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></svg>;
    case "security":
      return <svg {...commonProps}><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4M12 15v2" /></svg>;
    case "system":
      return <svg {...commonProps}><rect x="3" y="3" width="18" height="7" rx="2" /><rect x="3" y="14" width="18" height="7" rx="2" /><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6" /></svg>;
    case "menu":
      return <svg {...commonProps}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case "close":
      return <svg {...commonProps}><path d="m6 6 12 12M18 6 6 18" /></svg>;
    case "logout":
      return <svg {...commonProps}><path d="M10 17l5-5-5-5M15 12H3" /><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /></svg>;
  }
};

const Brand: React.FC = () => (
  <div className="log-shell__brand">
    <span className="log-shell__brand-mark" aria-hidden="true"><ShellIcon name="brand" className="log-shell__brand-icon" /></span>
    <span className="log-shell__brand-copy"><strong>Sistema Logístico</strong><span>Gestión integral</span></span>
    <span className="log-shell__phase">F013</span>
  </div>
);

interface NavigationProps {
  sections: NavigationSection[];
  activeTab: TabType;
  mfaEnabled: boolean;
  idPrefix: string;
  onSelect: (tab: TabType) => void;
}

const Navigation: React.FC<NavigationProps> = ({ sections, activeTab, mfaEnabled, idPrefix, onSelect }) => (
  <nav className="log-shell__navigation" aria-label="Módulos del sistema">
    {sections.map((section, sectionIndex) => {
      const sectionId = `${idPrefix}-navigation-section-${sectionIndex}`;
      return (
        <section className="log-shell__nav-section" aria-labelledby={sectionId} key={section.label}>
          <h2 className="log-shell__nav-heading" id={sectionId}>{section.label}</h2>
          <div className="log-shell__nav-list">
            {section.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  type="button"
                  className={`log-shell__nav-item${isActive ? " log-shell__nav-item--active" : ""}`}
                  onClick={() => onSelect(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  key={item.id}
                >
                  <ShellIcon name={item.icon} className="log-shell__nav-icon" />
                  <span className="log-shell__nav-label">{item.label}</span>
                  {item.id === "security" && (
                    <span
                      className={`log-shell__mfa-state ${mfaEnabled ? "log-shell__mfa-state--enabled" : "log-shell__mfa-state--pending"}`}
                      aria-label={mfaEnabled ? "MFA activo" : "MFA pendiente"}
                      title={mfaEnabled ? "MFA activo" : "MFA pendiente"}
                    >
                      {mfaEnabled ? "MFA ✓" : "MFA !"}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      );
    })}
  </nav>
);

interface UserPanelProps {
  displayName: string;
  email: string;
  roles: string[];
  onLogout: () => void;
}

const UserPanel: React.FC<UserPanelProps> = ({ displayName, email, roles, onLogout }) => {
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "U";
  const roleLabel = roles.join(", ") || "Sin roles asignados";

  return (
    <div className="log-shell__user-panel">
      <div className="log-shell__user-summary">
        <span className="log-shell__avatar" aria-hidden="true">{initials}</span>
        <span className="log-shell__user-copy">
          <strong title={displayName}>{displayName}</strong>
          <span title={roles.length ? roleLabel : email}>{roleLabel}</span>
        </span>
      </div>
      <button type="button" className="log-shell__logout" onClick={onLogout}>
        <ShellIcon name="logout" className="log-shell__logout-icon" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  );
};

const LoadingScreen: React.FC = () => (
  <main className="log-shell__loading" aria-busy="true">
    <div className="log-shell__loading-content" role="status" aria-live="polite">
      <span className="log-shell__loading-mark" aria-hidden="true"><ShellIcon name="brand" className="log-shell__loading-icon" /></span>
      <span className="log-shell__loading-indicator" aria-hidden="true" />
      <strong>Preparando tu espacio de trabajo</strong>
      <span>Validando la sesión segura…</span>
    </div>
  </main>
);

const AppContent: React.FC = () => {
  const { user, roles, isAuthenticated, isLoading, mfaEnabled, logout, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("documents");
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  // Preserve the original permission-based landing module selection.
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

  const visibleSections = useMemo(
    () => NAVIGATION_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => item.isVisible(hasPermission)),
    })).filter((section) => section.items.length > 0),
    [hasPermission],
  );

  useEffect(() => {
    const desktopViewport = window.matchMedia("(min-width: 1024px)");
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMobileNavigationOpen(false);
    };

    desktopViewport.addEventListener("change", handleViewportChange);
    return () => desktopViewport.removeEventListener("change", handleViewportChange);
  }, []);

  useEffect(() => {
    if (!isMobileNavigationOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleDrawerKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsMobileNavigationOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusableElements = Array.from(drawerRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ));
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleDrawerKeyDown);
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleDrawerKeyDown);
    };
  }, [isMobileNavigationOpen]);

  const handleCloseMobileNavigation = () => {
    setIsMobileNavigationOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    if (isMobileNavigationOpen) {
      setIsMobileNavigationOpen(false);
      window.requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <LoginPage />;

  const displayName = user?.display_name?.trim() || user?.email || "Usuario";
  const userEmail = user?.email || "";
  const activeItem = visibleSections.flatMap((section) => section.items).find((item) => item.id === activeTab);

  return (
    <div className="log-shell">
      <a className="log-shell__skip-link" href="#contenido-principal">Ir al contenido principal</a>

      <aside className="log-shell__sidebar" aria-label="Barra lateral principal">
        <Brand />
        <Navigation sections={visibleSections} activeTab={activeTab} mfaEnabled={mfaEnabled} idPrefix="desktop" onSelect={handleSelectTab} />
        <UserPanel displayName={displayName} email={userEmail} roles={roles} onLogout={() => void logout()} />
      </aside>

      <div className="log-shell__workspace">
        <header className="log-shell__mobile-bar">
          <button
            ref={menuButtonRef}
            type="button"
            className="log-shell__icon-button"
            onClick={() => setIsMobileNavigationOpen(true)}
            aria-label="Abrir navegación"
            aria-expanded={isMobileNavigationOpen}
            aria-controls="mobile-navigation-drawer"
          >
            <ShellIcon name="menu" className="log-shell__icon-button-svg" />
          </button>
          <span className="log-shell__mobile-context"><strong>Sistema Logístico</strong><span>{activeItem?.label || "Módulos"}</span></span>
          <span className="log-shell__mobile-avatar" aria-label={`Sesión de ${displayName}`}>{displayName.charAt(0).toUpperCase()}</span>
        </header>

        <main ref={mainRef} id="contenido-principal" className="log-shell__main" tabIndex={-1}>
          <div className="log-shell__content">
            {activeTab === "documents" && <DocumentCatalogPage />}
            {activeTab === "numbering" && <DocumentNumberingPage />}
            {activeTab === "series" && <DocumentSeriesPage />}
            {activeTab === "templates" && <DocumentTemplatesPage />}
            {activeTab === "structure" && <StructurePage />}
            {activeTab === "roles" && <RolesPage />}
            {activeTab === "audit" && <AuditPage />}
            {activeTab === "users" && <UsersPage />}
            {activeTab === "security" && <SecurityPage />}
            {activeTab === "system" && <SystemStatusPage />}
          </div>
        </main>
      </div>

      {isMobileNavigationOpen && (
        <div className="log-shell__drawer-layer">
          <button type="button" className="log-shell__drawer-backdrop" onClick={handleCloseMobileNavigation} aria-label="Cerrar navegación" tabIndex={-1} />
          <aside ref={drawerRef} id="mobile-navigation-drawer" className="log-shell__drawer" role="dialog" aria-modal="true" aria-label="Navegación principal">
            <div className="log-shell__drawer-header">
              <Brand />
              <button ref={closeButtonRef} type="button" className="log-shell__icon-button" onClick={handleCloseMobileNavigation} aria-label="Cerrar navegación">
                <ShellIcon name="close" className="log-shell__icon-button-svg" />
              </button>
            </div>
            <Navigation sections={visibleSections} activeTab={activeTab} mfaEnabled={mfaEnabled} idPrefix="mobile" onSelect={handleSelectTab} />
            <UserPanel displayName={displayName} email={userEmail} roles={roles} onLogout={() => void logout()} />
          </aside>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;
