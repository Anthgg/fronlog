# Sistema Logístico Integral - Frontend

Frontend del Sistema Logístico Integral construido con **React 19**, **TypeScript** y **Vite**.

## ARCHITECTURE GOLDEN RULE

1. **Frontend nunca accede directamente a DB:** Prohibido conectar a PostgreSQL o consultar tablas de Supabase directamente.
2. **Frontend nunca consume APIs externas de negocio:** RUC, placas, mapas y geocodificación se consultan vía FastAPI backend.
3. **Frontend nunca contiene secretos:** Prohibido `DATABASE_URL`, credenciales de BD o `service_role` keys.
4. **Backend ejecuta reglas y cálculos:** Toda lógica oficial de negocio, cálculos y validaciones residen en backend.
5. **Backend genera documentos:** PDFs, Excels y reportes se descargan o visualizan desde endpoints del backend.
6. **Backend controla persistencia:** Transacciones y base de datos son gestionadas por FastAPI.
7. **Backend es autoridad de permisos:** La UI puede ocultar elementos visuales, pero el backend valida cada solicitud.
8. **Frontend solamente consume contratos API:** Exclusivamente capa de presentación e interacción de usuario (**FRONTEND IS PRESENTATION ONLY**).

## Requisitos Técnicos

- **Node.js:** >= 20 LTS (Recomendado Node 22 LTS)
- **NPM:** >= 10

## Configuración del Entorno

1. Copiar el archivo de plantilla `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configurar la URL de la API Backend en `.env`:
   ```dotenv
   VITE_API_URL=http://localhost:8000
   ```

## Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 5173)
npm run dev

# Ejecutar linter con ESLint
npm run lint

# Verificación de tipos con TypeScript
npm run typecheck

# Compilar para producción
npm run build
```
