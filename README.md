# Sistema Logístico Integral - Frontend

Frontend del Sistema Logístico Integral.

## Política de Variables de Entorno y Seguridad

- Las llamadas transaccionales y de negocio se realizan exclusivamente a través de la API Backend (`VITE_API_URL`).
- **NUNCA** incluir `DATABASE_URL`, contraseñas directas de PostgreSQL ni `SUPABASE_SERVICE_ROLE_KEY` en el frontend.
- Los archivos `.env` locales están estrictamente ignorados por Git.

## Configuración Local

1. Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configurar la URL del backend (`VITE_API_URL`).
