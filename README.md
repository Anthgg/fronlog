# Sistema Logístico Integral - Frontend

Frontend del Sistema Logístico Integral construido con React, TypeScript y Vite.

## ARCHITECTURE GOLDEN RULE

1. **Frontend nunca accede directamente a DB:** Prohibido conectar a PostgreSQL o consultar tablas de Supabase directamente.
2. **Frontend nunca consume APIs externas de negocio:** RUC, placas, mapas y geocodificación se consultan vía FastAPI backend.
3. **Frontend nunca contiene secretos:** Prohibido `DATABASE_URL`, credenciales de BD o `service_role` keys.
4. **Backend ejecuta reglas y cálculos:** Toda lógica oficial de negocio, cálculos y validaciones residen en backend.
5. **Backend genera documentos:** PDFs, Excels y reportes se descargan o visualizan desde endpoints del backend.
6. **Backend controla persistencia:** Transacciones y base de datos son gestionadas por FastAPI.
7. **Backend es autoridad de permisos:** La UI puede ocultar elementos visuales, pero el backend valida cada solicitud.
8. **Frontend solamente consume contratos API:** Exclusivamente capa de presentación e interacción de usuario.

## Política de Variables de Entorno y Seguridad

- Las llamadas transaccionales se realizan exclusivamente a través de la API Backend (`VITE_API_URL`).
- **NUNCA** incluir `DATABASE_URL`, contraseñas directas de PostgreSQL ni `SUPABASE_SERVICE_ROLE_KEY` en el frontend.
- Los archivos `.env` locales están estrictamente ignorados por Git.

## Configuración Local

1. Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configurar la URL del backend (`VITE_API_URL=http://localhost:8000`).
