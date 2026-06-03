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

## Flujo de ramas

`feature|bugfix|refactor|chore|docs/* → develop → main`. Los `hotfix/*` parten
de `main` y se fusionan en `main` y `develop`. Commits con
[Conventional Commits](https://www.conventionalcommits.org/). Todo cambio entra
por Pull Request con CI en verde y al menos una aprobación.
