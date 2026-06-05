# Entregable 4 — Mapeo plantilla legacy → nueva

Cómo se reorganizan los formularios clínicos antiguos (en papel / monolíticos) hacia
la nueva estructura modular (plantillas dinámicas + componentes + perfil persistente
+ motor de escalas).

> Nota: este documento es la **guía de reconciliación**. Los nombres de campos legacy
> son los típicos de formularios de cuidados paliativos domiciliarios; al integrar,
> hay que contrastarlos con los formularios reales de la organización.

## Leyenda de acciones

- **Conserva** — el campo se mantiene tal cual (mismo dato, en la plantilla nueva).
- **Modulariza** — el campo deja de teclearse suelto y pasa a un componente reutilizable
  (`VitalSignsBlock`, `ScaleApplication`, `WoundTracker`, …).
- **Perfil** — el dato sale de la visita y vive en el **perfil persistente** del
  paciente (se edita una vez; la visita lo lee/edita en caliente).
- **Elimina** — se quita por redundancia (estaba repetido o se deriva de otro dato).
- **Agrega** — campo/función nueva que no existía en el legacy.

## A. Mapeo transversal (aplica a casi todas las plantillas)

| Campo legacy (típico) | Acción | Destino nuevo |
|---|---|---|
| Datos demográficos repetidos en cada hoja | **Perfil** | Ficha del paciente (cabecera) |
| Diagnósticos escritos a mano por visita | **Perfil** | `Diagnosis` (CIE-10) en el perfil |
| Lista completa de medicación re-copiada | **Perfil** + **Modulariza** | Medicación activa (perfil) + `MedicationDelta` (solo cambios) |
| Alergias en cada hoja | **Perfil** | `Allergy` (+ chip rojo en cabecera) |
| Antecedentes / hábitos | **Perfil** | `MedicalHistory` / `Habit` |
| Signos vitales sueltos (TA, FC, FR, Tº, SpO₂, peso, talla) | **Modulariza** | `VitalSignsBlock` (IMC calculado) |
| Escalas calculadas a mano (Karnofsky, ECOG, Barthel, ESAS…) | **Modulariza** | `ScaleApplication` (motor: puntaje + alerta) |
| Heridas descritas en texto libre | **Modulariza** | `WoundTracker` (+ fotos) |
| "IMC" escrito a mano | **Elimina** | Derivado por `VitalSignsBlock` |
| "Próxima cita" anotada | **Modulariza** | `NextAppointmentScheduler` (agenda) |
| Firma del cuidador en papel | **Modulariza/Agrega** | `SignaturePad` → MinIO |
| Geolocalización / hora de llegada | **Agrega** | Check-in con geolocalización |
| Resultado de la visita (no realizada, rehúso) | **Agrega** | Cierre con `outcome` + acciones |

## B. Mapeo por plantilla (ejemplos representativos)

### Médico (adulto)
| Legacy | Acción | Destino |
|---|---|---|
| Motivo de consulta / evolución | Conserva | `FieldsGroup` (sección evolución) |
| Exploración física + vitales | Modulariza | `VitalSignsBlock` + texto en `FieldsGroup` |
| Karnofsky/ECOG/PPI a mano | Modulariza | `ScaleApplication` |
| Síntomas (ESAS) | Modulariza | `SymptomChecklist` / `ScaleApplication` ESAS-r |
| Indicaciones y cambios de fármacos | Perfil + Modulariza | `MedicationDelta` + `RecommendationsList` |
| Interconsulta a otra disciplina | Agrega | `InterconsultRequest` |
| Pronóstico repetido en varias hojas | Elimina | Único en la nota médica |

### Enfermería
| Legacy | Acción | Destino |
|---|---|---|
| Constantes | Modulariza | `VitalSignsBlock` |
| Curaciones / úlceras (texto) | Modulariza | `WoundTracker` + `PhotoAttachment` |
| Administración de medicación | Modulariza | `MedicationDelta` (adjust/suspend) |
| Educación al cuidador | Conserva | `RecommendationsList` |
| Estado del cuidador | Agrega | `CaregiverStatus` (Zarit opcional) |

### Trabajo social
| Legacy | Acción | Destino |
|---|---|---|
| Datos socioeconómicos re-tecleados | Perfil | `SocialProfile` |
| Composición familiar / genograma a mano | Perfil | `FamilyMember` + genograma |
| Cuidador principal | Perfil | `Caregiver` (extendido) |
| Recursos gestionados | Conserva | `RecommendationsList` |
| Plan e interconsulta | Modulariza | `InterconsultRequest` + `NextAppointmentScheduler` |

### Psicología
| Legacy | Acción | Destino |
|---|---|---|
| Estado emocional / examen mental | Conserva | `FieldsGroup` |
| Riesgo suicida / duelo | Conserva (estructura) | `FieldsGroup` (radios) |
| Sobrecarga del cuidador a mano | Modulariza | `ScaleApplication` (Zarit) vía `CaregiverStatus` |
| Escala de calidad de vida | Modulariza | `ScaleApplication` (POS / EQ-5D) |

### Fisiatría
| Legacy | Acción | Destino |
|---|---|---|
| Valoración funcional (Barthel) | Modulariza | `FunctionalStatus` (Barthel) |
| Dolor | Modulariza | `ScaleApplication` (EVA / Wong-Baker) |
| Rango articular / fuerza | Conserva | `FieldsGroup` |
| Plan de ejercicios / objetivos | Conserva | `FieldsGroup` + `RecommendationsList` |

### Pediátricas (paliativo infantil)
| Legacy | Acción | Destino |
|---|---|---|
| Performance | Modulariza | `ScaleApplication` (Lansky) |
| Dolor no verbal | Modulariza | `ScaleApplication` (FLACC / Wong-Baker) |
| Alimentación (vía/sonda) | Conserva | `FieldsGroup` (radios) |
| Calidad de vida | Modulariza | `ScaleApplication` (PedsQL, borrador) |

### Seguimiento telefónico / duelo
| Legacy | Acción | Destino |
|---|---|---|
| Llamada (quién atendió, motivo) | Conserva | `FieldsGroup` |
| Síntomas referidos | Modulariza | `SymptomChecklist` |
| Fase/riesgo de duelo | Conserva (estructura) | `FieldsGroup` (radios/chips) |
| Derivación | Modulariza | `InterconsultRequest` |

## C. Resumen de la reducción de duplicación

- **Demografía, dx, medicación, alergias, antecedentes, datos sociales** dejan de
  re-teclearse por visita → viven en el **perfil** y se leen como contexto.
- **Vitales, escalas, heridas, próxima cita, firma** se **modularizan** en componentes
  reutilizables compartidos por todas las plantillas.
- Se **eliminan** los cálculos manuales (IMC, puntajes) → los hace el sistema.
- Se **agregan** check-in con geolocalización, resultado de visita con acciones,
  interconsultas y firma digital.

## D. Riesgos / a confirmar al integrar

- Reconciliar nombres exactos de campos con los formularios legacy reales.
- Escalas marcadas **[BORRADOR]** (MMSE, PaP, EQ-5D índice, PedsQL, IDC-Pal, NANEAS):
  validar ítems/cortes antes de activarlas.
- Campos legales/firmados del legacy (consentimientos) → módulo de documentos (MinIO).
