import React, { useEffect, useRef, useState } from "react";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

type IconProps = React.SVGProps<SVGSVGElement>;

const RocketIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M14.4 5.6c2.3-2.3 4.6-2.4 5.9-2.3.1 1.3 0 3.6-2.3 5.9l-4.4 4.4-3.6.8.8-3.6 3.6-5.2Z" />
    <path d="m13.5 6.5 4 4M10.8 10.8 7.5 9.7 4 13.2l4.2 1.1M13.6 13.6l1.1 4.2 3.5-3.5-1.1-3.3M7.2 16.8c-1.2.2-2 .8-2.4 2.1 1.3-.4 1.9-1.2 2.1-2.4" />
    <circle cx="15.9" cy="7.7" r="1.35" />
  </svg>
);

const MailIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4.5 7 7.5 6 7.5-6" />
  </svg>
);

const LockIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <rect x="4" y="10" width="16" height="10" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2.5" />
  </svg>
);

const EyeIcon = ({ hidden = false, ...props }: IconProps & { hidden?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M2.8 12s3.3-5.2 9.2-5.2S21.2 12 21.2 12s-3.3 5.2-9.2 5.2S2.8 12 2.8 12Z" />
    <circle cx="12" cy="12" r="2.4" />
    {hidden && <path d="m4 4 16 16" />}
  </svg>
);

const ArrowRightIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M5 12h14M14 7l5 5-5 5" />
  </svg>
);

const AlertIcon = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.5L13.7 4.2a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 16.5h.01" />
  </svg>
);

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

const LoginParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let particles: Particle[] = [];
    let animationFrame = 0;
    let previousTime = performance.now();
    let viewportWidth = 0;
    let viewportHeight = 0;

    const createParticles = () => {
      const count = Math.max(75, Math.min(180, Math.floor((viewportWidth * viewportHeight) / 7600)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * viewportWidth,
        y: Math.random() * viewportHeight,
        radius: Math.random() * 1.35 + 0.45,
        speedX: (Math.random() - 0.5) * 9,
        speedY: Math.random() * 24 + 12,
        opacity: Math.random() * 0.68 + 0.22,
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, viewportWidth, viewportHeight);
      for (const particle of particles) {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(178, 220, 255, ${particle.opacity})`;
        context.fill();
      }
    };

    const resize = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewportWidth * pixelRatio);
      canvas.height = Math.floor(viewportHeight * pixelRatio);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      createParticles();
      draw();
    };

    const animate = (time: number) => {
      const elapsedSeconds = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;

      for (const particle of particles) {
        particle.y -= particle.speedY * elapsedSeconds;
        particle.x += particle.speedX * elapsedSeconds;

        if (particle.y < -3) {
          particle.y = viewportHeight + 3;
          particle.x = Math.random() * viewportWidth;
        }
        if (particle.x > viewportWidth + 3) particle.x = -3;
        if (particle.x < -3) particle.x = viewportWidth + 3;
      }

      draw();
      animationFrame = window.requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    if (!reducedMotion) animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas ref={canvasRef} className="login-particles" aria-hidden="true" />;
};

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
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
        if (error.code === "INVALID_CREDENTIALS") {
          setErrorMsg("Credenciales inválidas. Verifique su correo o contraseña.");
        } else {
          setErrorMsg(error.message || "Error al iniciar sesión.");
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
    setErrorMsg(null);
  };

  return (
    <main className="login-page">
      <LoginParticleBackground />
      <div className="login-ambient-glow" aria-hidden="true" />

      <section className="login-shell" aria-labelledby="login-title">
        <header className="login-header">
          <div className="login-brand-mark" aria-hidden="true">
            <RocketIcon className="login-brand-icon" />
          </div>
          <h1 id="login-title">Sistema Logístico Integral</h1>
          <p>Gestión inteligente de carga</p>
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
          <summary>Accesos demo</summary>
          <p>Completa el correo de un perfil habilitado para pruebas.</p>
          <div className="login-demo-grid">
            <button type="button" onClick={() => handleQuickFill("gerencia.demo@logistica.local")}>Gerencia</button>
            <button type="button" onClick={() => handleQuickFill("almacen.demo@logistica.local")}>Almacén</button>
            <button type="button" onClick={() => handleQuickFill("auditor.demo@logistica.local")}>Auditor</button>
          </div>
        </details>

        <footer className="login-footer">
          <p>© 2026 Sistema Logístico Integral</p>
          <p>Acceso restringido a personal autorizado.</p>
        </footer>
      </section>
    </main>
  );
};
