# Pallium

Sistema web para una clínica de cuidados paliativos y crónicos. Plataforma
multidisciplinaria que digitaliza el ciclo del paciente: registro, agenda,
rutas de visitas domiciliarias, registro clínico por especialidad, escalas
funcionales y pronósticas, alertas, timeline y auditoría.

## Stack

- **Backend:** NestJS · TypeScript · Prisma 7 · arquitectura por capas
  (controllers → services → repositories → domain)
- **Base de datos:** PostgreSQL 16
- **Cache/colas:** Redis · BullMQ
- **Archivos:** MinIO (local) / S3 (prod)
- **Auth:** JWT (access + refresh) con RBAC por permisos
- **Frontend:** Next.js 15 (App Router) · _pendiente_

## Estructura

```
backend/   API NestJS (auth, pacientes, visitas+cadencia, alertas,
           rutas+WhatsApp, registro clínico, escalas)
```

## Puesta en marcha (backend)

```bash
cd backend
cp .env.example .env
docker compose up -d postgres redis minio
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed       # roles, permisos, categorías, escalas y admin inicial
npm run start:dev
```

API en `http://localhost:3000/api` · health en `/api/health`.

## Usuarios de prueba (seed)

El seed crea un administrador y un usuario por cada rol del sistema.

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administrador | `admin@pallium.local` | `Admin12345` |
| Coordinador médico | `coordinador@pallium.local` | `Pallium123` |
| Médico | `medico@pallium.local` | `Pallium123` |
| Enfermería | `enfermeria@pallium.local` | `Pallium123` |
| Psicología | `psicologia@pallium.local` | `Pallium123` |
| Trabajo Social | `trabajosocial@pallium.local` | `Pallium123` |
| Fisiatra | `fisiatra@pallium.local` | `Pallium123` |
| Agenda | `agenda@pallium.local` | `Pallium123` |
| Auditor | `auditor@pallium.local` | `Pallium123` |

> Las claves se pueden sobrescribir con `ADMIN_EMAIL`, `ADMIN_PASSWORD` y
> `STAFF_PASSWORD`. El **Coordinador médico** crea pacientes, cambia su estado
> clínico y asigna el equipo clínico (médico/enfermera) a las rutas.

## Flujo de ramas

`feature|bugfix|refactor|chore|docs/* → develop → main`. Los `hotfix/*` parten
de `main` y se fusionan en `main` y `develop`. Commits con
[Conventional Commits](https://www.conventionalcommits.org/). Todo cambio entra
por Pull Request con CI en verde y al menos una aprobación.
