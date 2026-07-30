# Despliegue — easy-point-ui

La app se distribuye como imagen Docker (`Dockerfile`, build multi-stage sobre `node:22-alpine`, salida `output: 'standalone'` de Next.js). Es un contenedor sin estado: no escribe a disco, no usa websockets ni jobs en background, toda la sesión vive en cookies HttpOnly emitidas por el backend NestJS. Plataforma objetivo: **GCP Cloud Run**.

## 1. Variables de entorno

Ver `.env.example` para la plantilla. Nunca se hornea nada en la imagen — todo se lee en runtime (`process.env`), así que **una sola imagen sirve para todos los ambientes** cambiando solo estas variables.

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `BACKEND_API_URL` | **Sí** | — | URL del backend NestJS, alcanzable en red privada desde el contenedor (nunca expuesta al navegador). Sin ella el contenedor **no arranca** — ver §3. |
| `API_VERSION` | No | `v1` | Prefijo de versión para `shared/api/backend-fetch.ts`. ⚠️ Las rutas `/api/auth/*` (login, OTP, refresh, logout) ignoran esta variable y hardcodean `/api/v1`. |
| `OTP_REQUEST_PATH` | **Sí en producción** | `/api/v1/development/otp` | Endpoint de NestJS que recibe el paso 1 del login. El default es el endpoint de **desarrollo** (imprime el OTP en la consola del backend en vez de mandarlo por email). En producción hay que setearlo al endpoint real — confirmar la ruta exacta con el backend antes de desplegar, no está verificada en este repo. |
| `BACKEND_TIMEOUT_MS` | No | `30000` | Timeout del proxy BFF (`shared/api/backend-fetch.ts`) hacia el backend. |
| `NODE_ENV` | Automática | `production` | La fija `next start` / el server standalone. **No pisar.** Controla si las cookies `Secure` se relevan intactas (`app/api/auth/*/route.ts`) — mal seteada, las cookies pierden `Secure` detrás de HTTPS y el login queda en loop. |

No hace falta ninguna variable `NEXT_PUBLIC_*`: el navegador solo habla con `/api/v1` (mismo origen), nunca directo con el backend.

## 2. Requisitos de la plataforma

- **HTTPS de punta a punta.** El backend NestJS también debe emitir las cookies con `Secure` — la UI solo las relee/relaya, nunca agrega el flag.
- **Red privada al backend.** `BACKEND_API_URL` debe resolver desde dentro del contenedor, no desde el navegador. En Cloud Run: mismo proyecto, backend con `--ingress=internal`, URL `*.a.run.app` interna o VPC connector.
- **Health check → `GET /api/health`.** No depende del backend (ver `app/api/health/route.ts`) — si consultara a NestJS, una caída del backend tumbaría también la UI. Todas las demás rutas exigen sesión y devuelven 307 sin cookies, así que **no sirven como health check**.
- **Puerto:** el contenedor escucha en `8080` (`ENV PORT=8080` en el `Dockerfile`). Cloud Run lo inyecta automáticamente; en otras plataformas, pasarlo explícito.

## 3. Fail-fast al arrancar

`instrumentation.ts` corre una vez cuando arranca el proceso (no durante `next build`) y valida:
- `BACKEND_API_URL` presente siempre.
- `OTP_REQUEST_PATH` presente cuando `NODE_ENV=production`.

Si falta algo, el proceso hace `process.exit(1)` — el contenedor muere de forma inequívoca en vez de quedar "sano" sirviendo 500 en cada request. Verificado con `docker run` real (ver §5).

## 4. Build y prueba local de la imagen

```bash
docker compose up --build
```

Usa `compose.yaml` (raíz del repo): construye desde el `Dockerfile`, publica `localhost:3000 → 8080` y apunta `BACKEND_API_URL` a `http://host.docker.internal:3001` — el backend corriendo en el host (vía su propio `docker compose` o `pnpm start:dev`). Ajustar `host.docker.internal` si el backend vive en otro lado.

Build/run manual sin compose:

```bash
docker build -t easy-point-ui:local .
docker run --rm -p 8080:8080 \
  -e BACKEND_API_URL=http://host.docker.internal:3001 \
  -e OTP_REQUEST_PATH=/api/v1/development/otp \
  easy-point-ui:local

curl localhost:8080/api/health   # → {"status":"ok"}
```

Probar el fail-fast (sin `BACKEND_API_URL`):

```bash
docker run --rm -e OTP_REQUEST_PATH=/api/v1/development/otp -p 8080:8080 easy-point-ui:local
# → "Missing required env vars: BACKEND_API_URL" y exit code 1
```

## 5. Despliegue a Cloud Run

### Manual (una vez, o para verificar)

```bash
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_SERVICE=easy-point-ui,_REPO=easy-point
```

`cloudbuild.yaml` construye, publica a Artifact Registry y despliega. Las variables de entorno de runtime (`BACKEND_API_URL`, `OTP_REQUEST_PATH`, ...) **no** están en este archivo — se configuran una sola vez sobre el servicio y persisten entre deploys:

```bash
gcloud run services update easy-point-ui \
  --region=us-central1 \
  --set-env-vars=BACKEND_API_URL=<url-interna>,OTP_REQUEST_PATH=/api/v1/auth/otp
```

### Automático (GitHub Actions)

`.github/workflows/ci.yml` corre lint + test + build en cada PR/push.

`.github/workflows/deploy.yml` construye, publica y despliega a Cloud Run en cada push a `master`, autenticando por **Workload Identity Federation** (sin claves de service account de larga duración en GitHub). Antes de que corra, configurar en el repo de GitHub (**Settings → Secrets and variables → Actions → Variables**):

| Variable | Ejemplo | Qué es |
|---|---|---|
| `GCP_PROJECT_ID` | `easy-point-prod` | Proyecto de GCP |
| `GCP_REGION` | `us-central1` | Región de Cloud Run / Artifact Registry |
| `GCP_SERVICE` | `easy-point-ui` | Nombre del servicio Cloud Run |
| `GCP_ARTIFACT_REPO` | `easy-point` | Repo de Artifact Registry |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/.../workloadIdentityPools/.../providers/...` | Nombre completo del proveedor WIF |
| `GCP_SERVICE_ACCOUNT` | `deployer@easy-point-prod.iam.gserviceaccount.com` | Service account que despliega |

El pool/proveedor de Workload Identity Federation y la service account se crean una vez por fuera de este repo (consola de GCP o `gcloud iam workload-identity-pools`) — no hay Terraform ni IaC acá.

## 6. Checklist antes del primer deploy a producción

- [ ] Confirmar con el equipo de backend la ruta real de `OTP_REQUEST_PATH` (el comentario original del código decía `/auth/otp`, pero el resto del repo prefija todo con `/api/v1` — verificar, no asumir).
- [ ] Backend NestJS desplegado, alcanzable por red privada desde donde corra la UI, y emitiendo cookies con `Secure` bajo HTTPS.
- [ ] `BACKEND_API_URL` seteada en el servicio Cloud Run (no en el `Dockerfile`, no en `.env` dentro de la imagen).
- [ ] Variables de GitHub Actions configuradas (tabla de §5) si se usa el deploy automático.
- [ ] `gcloud run services update ... --set-env-vars` corrido al menos una vez antes del primer deploy vía CI, para que la primera revisión ya tenga configuración válida.

## Fuera de alcance de este documento

- Desplegar `easy-point-api` (su `Dockerfile` actual es de desarrollo, `pnpm start:dev` en watch mode).
- Terraform/IaC para crear los recursos de GCP.
- Dominio propio y CDN delante de `/_next/static`.
