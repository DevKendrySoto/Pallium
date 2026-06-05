# Entregable 7 — Especificación UX del módulo clínico

Guía de diseño de interacción para las pantallas clínicas (perfil, agenda, visita,
plantillas dinámicas). La **API es la fuente de verdad**; la UI optimiza la captura
en campo (tablet/móvil) y comunica estado con claridad. Estado: ✅ implementado ·
🟡 parcial · ⏳ pendiente.

## 1. Principios

- **Captura en campo primero:** la visita domiciliaria se llena en tablet/móvil, a
  veces con conectividad pobre. Prioriza pocos toques, objetivos grandes y autosave.
- **Una cosa a la vez:** plantillas en secciones cortas (≤6–8) con ≤12 campos; si
  hace falta más, sub-secciones colapsables o wizard.
- **Seguridad visible:** alergias y banderas (DNR, claudicación) siempre en la
  cabecera; modo solo lectura (Auditor) con banner permanente.

## 2. Accesibilidad y entrada

| Norma | Detalle | Estado |
|---|---|---|
| Touch targets ≥44px | Botones/chips/inputs con `min-h-9`+ (36px) → revisar a 44px en controles primarios de visita | 🟡 |
| Fuente ≥16px en inputs | `text-base` (16px) en inputs/areas para evitar zoom en iOS | ✅ (componentes clínicos usan `text-base`) |
| Sentence case | Todos los textos en *sentence case* (no Title Case ni MAYÚSCULAS) | ✅ |
| Sin `select` para <6 opciones | Radios/chips (botones) en su lugar | ✅ (`FieldsGroup` radio/chips, outcomes, estados) |
| Validación en línea | Errores por campo bajo el control, en el momento | 🟡 (RHF+Zod en formularios; pendiente en el render dinámico) |
| Contraste / foco | Foco azul (`--ring`), borde `slate-200`; cumplir AA | 🟡 |

## 3. Feedback y estado

| Norma | Detalle | Estado |
|---|---|---|
| Cálculos en vivo | IMC en `VitalSignsBlock`; puntaje/interpretación al aplicar escala | ✅ |
| Auto-save de borrador | Cada ~10s (hoy debounce 2s) con indicador "Guardando…/Borrador guardado HH:MM" | ✅ |
| Indicador de progreso | Barra/paso en plantillas con >3 secciones | ⏳ |
| Estados de carga | Skeletons en listados y detalle; spinners en acciones | ✅ |
| Errores de red | Toasts normalizados; 401→login, 403→"sin permisos" | ✅ (wrapper `api`) |

## 4. Contexto histórico (siempre disponible)

En la pantalla de visita, mostrar contexto sin abandonar el formulario:

- **Cabecera fija:** paciente, estado, alergias (rojo), última visita.
- **Drawer lateral (⏳):** último ESAS, última escala aplicada, medicación activa,
  heridas previas. Hoy: cabecera con alergias ✅; el drawer con últimas mediciones
  queda pendiente.

## 5. Paleta y tono visual

- Neutros **slate**; primario **azul** (`blue-600`); **verde** (emerald) para activo
  y confirmaciones; **ámbar** para alertas no críticas; **rojo** solo para deceso y
  errores críticos. Sin bandas naranjas saturadas dominantes. ✅ (design tokens en
  `globals.css`).
- Bordes `slate-200`, sin sombras pesadas. ✅
- Radios: `--radius-md` 8px, `--radius-lg` 12px. ✅

## 6. Patrones por pantalla

- **Agenda** (`/agenda`): lista por día; cada visita enlaza a su detalle; filtro por
  tipo; badges de tipo/estado. ✅
- **Visita** (`/visitas/[id]`): check-in con geolocalización → render dinámico de la
  plantilla (rol×categoría) → autosave → cierre con resultado (radios) → firma del
  cuidador (canvas → MinIO). ✅
- **Perfil del paciente** (`/patients/[id]`): datos + acciones de estado + timeline.
  Pestañas Clínico/Social (alergias, antecedentes, cuidadores…) ⏳ (backend listo).
- **Auditor:** banner permanente de solo lectura + mutaciones ocultas. ✅

## 7. Componentes — reglas de interacción

- **FieldsGroup:** layout 1–3 columnas; radios/chips para enumerados cortos; textarea
  nativo de ≥80px; `switch` como botón Sí/No.
- **VitalSignsBlock:** grilla compacta; IMC calculado y de solo lectura; resaltar
  fuera de rango con texto (no fondo) discreto.
- **ScaleApplication:** un bloque por escala; ítems según tipo; botón "Aplicar" que
  muestra puntaje + interpretación + alerta; ofrece "último puntaje" (⏳).
- **WoundTracker / MedicationDelta / PhotoAttachment:** listas de tarjetas con
  agregar/quitar; fotos con thumbnails ≥44px y cámara en móvil.
- **SignaturePad:** canvas a ancho completo, trazo grueso, limpiar/confirmar.

## 8. Pendientes UX priorizados

1. Subir touch targets a 44px en controles primarios de visita.
2. Drawer de contexto histórico (último ESAS/escala, medicación activa).
3. Indicador de progreso en plantillas con >3 secciones.
4. Validación en línea dentro del render dinámico (no solo en formularios RHF).
5. Pestañas Clínico/Social del perfil (consumir Fases 1–2).
