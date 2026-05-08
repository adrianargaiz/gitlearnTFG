# Revisión de la memoria del TFG — GitLearn

**Fecha de revisión:** 2026-05-05
**Documento revisado:** `TRABAJO FIN DE GRADO.docx`
**Cotejado con:** código actual del proyecto + 3 rúbricas (contenidos 50%, aspectos formales 20%, exposición 30%) + normas del módulo de Proyecto.

---

## 0. Resumen ejecutivo

La memoria tiene la estructura básica correcta y la mayoría de apartados redactados, pero hay **tres bloques de problemas**:

1. **Contenido incoherente con el código actual.** La memoria describe el proyecto tal y como se planteó al inicio; en el camino has cambiado o ampliado cosas (tipos de ejercicios, modelo de datos, endpoints, asignaciones de profesor a alumno) que no se han reflejado.
2. **Apartados pendientes o vacíos.** Hay diagramas que solo tienen el título, capturas referenciadas pero no insertadas, y dos secciones completas marcadas como `[PENDIENTE]` (Ampliación + Conclusiones).
3. **Falta un apartado obligatorio según la rúbrica formal: Validación y pruebas (1,5 puntos sobre 7 del bloque).** Sin esto pierdes puntuación segura.

Adicionalmente la memoria tiene unas **19 páginas** estimadas según el índice y las normas exigen **entre 25 y 40**, así que habrá que ampliar.

---

## 1. Incoherencias entre la memoria y el código actual

### 1.1. Tipos de ejercicios — falta `emparejar`

**Memoria (apartado 3.1.1, RF-07 y 3.3.2):**

> "ejercicios de tipo opción múltiple, rellenar huecos y arrastrar y soltar"

**Código real:** `backend/src/types/index.ts` define

```typescript
type ExerciseType =
  | "opcionMultiple"
  | "rellenarHuecos"
  | "arrastrarSoltar"
  | "emparejar";
```

El tipo `emparejar` está implementado y funcional en `lesson-view.component.ts` (renderiza con grid de 2 columnas, definiciones barajadas con shuffle determinístico). **Hay que añadirlo en la memoria.**

**Dónde corregir:**

- RF-07 (página de requisitos funcionales)
- 3.3.2 Diagrama Entidad-Relación → colección `ejercicios`, campo `tipo`
- 3.4.1 Stack tecnológico (si describes tipos de actividades)

---

### 1.2. Modelo de datos — `lecciones.ejercicios[]` no existe

**Memoria (3.3.2):**

> "Colección: lecciones — \_id, titulo, descripcion, nivel, estado, autorId, fechaCreacion, xpRecompensa, ejercicios[]"

**Código real:** `backend/src/models/Leccion.ts` no tiene el array `ejercicios[]`. Los ejercicios son una **colección separada** con `leccionId` como referencia (`backend/src/models/Ejercicio.ts`). Esto es lo correcto para MongoDB y lo que has implementado de verdad.

**Cambiar en 3.3.2:**

- Eliminar `ejercicios[]` del esquema de `lecciones`
- Añadir `orden` al esquema de `lecciones` (existe en el modelo real)
- Añadir `explicacion` al esquema de `ejercicios` (existe y es importante: se muestra al alumno tras responder)
- Añadir colección `usuarioInsignia` (tabla intermedia con `usuarioId`, `insigniaId`, `fechaObtencion`) — es una colección que tienes y la memoria no menciona
- Añadir colección `insignias` por separado (la memoria las mete dentro de `usuarios.insignias[]` pero realmente son su propia colección)

---

### 1.3. Insignias — modelo mal descrito

**Memoria:** "usuarios … insignias[]"

**Código real:**

- Colección `Insignia` (catálogo: nombre, descripción, icono, condición)
- Colección `UsuarioInsignia` (relación N–M con fecha de obtención)
- Las condiciones son un enum: `primera_leccion`, `racha_7`, `racha_30`, `nivel_basico`, `nivel_intermedio`, `nivel_avanzado`, `nivel_experto`, `todas_lecciones`

Reescribe el apartado de insignias del 3.3.2.

---

### 1.4. CU-02 — el flujo descrito no es el real

**Memoria:**

> "5. Guarda la lección en estado borrador. 6. El sistema notifica al administrador para su revisión."

**Código real:** El profesor puede **publicar directamente sus lecciones** (botón "Publicar lección" en `lesson-editor.component.ts`, llama a `setPropiasLeccionEstado` en backend). El admin **no revisa antes de publicar**, solo modera/archiva a posteriori. No hay sistema de notificación al admin.

**Reescribir el flujo principal:**

> "5. El profesor guarda la lección como borrador o la publica directamente. 6. Si se publica, queda visible en el mapa de lecciones del alumno."

Y añadir flujo alternativo: "El administrador puede archivar o despublicar cualquier lección desde el panel de moderación de contenido."

---

### 1.5. RF-05 (Recuperación de contraseña) — no está implementado

**Memoria RF-05:**

> "El sistema permite recuperar el acceso mediante un enlace enviado por email."

**Código real:** no hay ningún endpoint ni componente de "recuperar contraseña". `package.json` del backend tiene `nodemailer` instalado pero no se usa.

**Opciones:**

- (a) Eliminar RF-05 de la memoria
- (b) Marcarlo como **prioridad baja / no implementado en esta versión** y moverlo a "Ampliación y posibles mejoras"

Recomiendo (b): así no pierdes una funcionalidad bien pensada y la justificas en mejoras futuras.

---

### 1.6. RF-14 (Estadísticas de profesor sobre alumnos) — no implementado

**Memoria RF-14:**

> "El profesor puede consultar el progreso y estadísticas de los estudiantes en sus lecciones."

**Código real:** el profesor solo ve sus propias lecciones (`/profesor/lecciones`) y, con la nueva feature de asignaciones, puede asignarlas a alumnos. No hay vista de estadísticas agregadas (cuántos alumnos han completado, nota media, etc.).

**Opciones:**

- (a) Quitarlo de RF y moverlo a "Ampliación y posibles mejoras"
- (b) Implementarlo (ver sección 4 de este documento)

---

### 1.7. **NUEVO:** Sistema de asignaciones profesor → alumno (no aparece en la memoria)

Esto es la feature que acabas de añadir y **no está reflejada en ningún sitio de la memoria**.

**Qué hay que añadir:**

**a) Nuevo requisito funcional** — añadir entre RF-13 y RF-14:

> **RF-XX — Asignar lecciones a alumnos.** El profesor puede asignar una lección concreta a uno o varios alumnos seleccionados, opcionalmente con una fecha límite. Los alumnos visualizan estas tareas en una sección "Tareas" del navbar, separadas en pendientes y completadas. Prioridad: alta.

**b) Nuevo caso de uso** (CU-03 o donde proceda):

> **CU-XX — Asignar una lección a alumnos concretos**
>
> - Actor principal: Profesor
> - Precondición: tiene al menos una lección creada
> - Postcondición: los alumnos seleccionados ven la asignación en su pestaña "Tareas"
> - Flujo: 1) accede a "Mis lecciones", 2) pulsa el botón "Asignar" de una lección, 3) se abre un modal con buscador de alumnos y multiselect, 4) opcionalmente fija fecha límite, 5) confirma y se crea la asignación.

**c) Nueva colección en 3.3.2:**

```
Colección: asignaciones
_id, profesorId, leccionId, estudiantesIds[], titulo (opcional),
fechaAsignacion, fechaLimite (opcional), activa
```

**d) Nuevos endpoints en 3.3.4:**

```
GET    /api/asignaciones/mias                  → estudiante
GET    /api/asignaciones/estudiantes           → profesor (lista alumnos)
GET    /api/asignaciones/mis-asignaciones      → profesor
GET    /api/asignaciones/por-leccion/:leccionId → profesor
POST   /api/asignaciones                        → profesor crea
DELETE /api/asignaciones/:id                    → profesor elimina
```

**e) Justificación en 3.3.3 (Diseño de la interfaz y navegabilidad):**

> "El navbar del estudiante incluye una pestaña 'Tareas' con un badge numérico que indica el número de asignaciones pendientes. La página de Tareas separa visualmente las pendientes de las completadas y muestra fecha límite (con marca de vencida si procede)."

---

### 1.8. Endpoints REST — la lista de la memoria está incompleta

La tabla del apartado 3.3.4 lista solo unos pocos endpoints. **Hay muchos más implementados.** Lista corregida que deberías incluir (sustituye la actual):

```
AUTH
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/github
GET    /api/auth/github/callback

LECCIONES
GET    /api/lecciones                  Listar publicadas (público)
GET    /api/lecciones/mias             Lecciones del profesor (auth: profesor)
GET    /api/lecciones/:id              Detalle de lección publicada
POST   /api/lecciones                  Crear (auth: profesor)
PUT    /api/lecciones/:id              Editar (auth: profesor, propia)
PATCH  /api/lecciones/:id/estado       Cambiar estado (auth: profesor, propia)
DELETE /api/lecciones/:id              Eliminar (auth: profesor, no publicada)

EJERCICIOS
GET    /api/ejercicios/:leccionId      Listar ejercicios de una lección
POST   /api/ejercicios                 Crear (auth: profesor)
PUT    /api/ejercicios/:id             Editar (auth: profesor)
DELETE /api/ejercicios/:id             Eliminar (auth: profesor)

PROGRESO
GET    /api/progreso/:usuarioId        Ver progreso (propio o admin)
POST   /api/progreso                   Registrar lección completada

INSIGNIAS
GET    /api/insignias                  Catálogo (público)
GET    /api/insignias/:usuarioId       Insignias del usuario

ASIGNACIONES
GET    /api/asignaciones/mias                 (auth: estudiante)
GET    /api/asignaciones/estudiantes          (auth: profesor)
GET    /api/asignaciones/mis-asignaciones     (auth: profesor)
GET    /api/asignaciones/por-leccion/:leccionId (auth: profesor)
POST   /api/asignaciones                       (auth: profesor)
DELETE /api/asignaciones/:id                   (auth: profesor)

ADMIN
GET    /api/admin/usuarios                Listar todos los usuarios
PUT    /api/admin/usuarios/:id/rol        Cambiar rol
PUT    /api/admin/usuarios/:id/estado     Activar/desactivar
GET    /api/admin/lecciones               Todas las lecciones (cualquier estado)
PUT    /api/admin/lecciones/:id/estado    Moderar contenido
```

---

## 2. Apartados vacíos o incompletos en la memoria

### 2.4. 3.3.3 Diseño de interfaz — faltan capturas reales

**Texto actual:** "Aquí podemos observar algunos ejemplos de las interfaces que verán los distintos usuarios. Estudiante: / Profesor: / Administrador:" → seguido de huecos vacíos.

**Falta:**

- **Diagrama de navegabilidad** (sitemap/flowchart de pantallas y rutas). La rúbrica lo pide específicamente.
- **Capturas reales** de las tres áreas.

📷 **CAPTURAS necesarias:**

**Estudiante** (al menos 4):

- Mapa de lecciones (`/app/lecciones`) — captura entera con varios niveles
- Vista de ejercicio (`/app/lecciones/:id`) — preferiblemente con un ejercicio de tipo `arrastrarSoltar` o `emparejar` a la vista, que son los más visuales
- Pantalla de finalización con XP ganado y celebración
- **Tareas asignadas** (`/app/tareas`) — esta es la nueva feature, **muy importante** mostrar pendientes y completadas
- Página de progreso con XP, racha, insignias

**Profesor** (al menos 3):

- Dashboard del profesor
- Listado "Mis lecciones" con la columna de acciones (editar / asignar / eliminar)
- Editor de lección con un ejercicio expandido
- **Modal de asignación** (botón "Asignar" abierto, con buscador de alumnos y selección)

**Administrador** (al menos 2):

- Dashboard del admin
- Gestión de usuarios (`/admin/usuarios`)

📷 **CAPTURA: diagrama de navegabilidad** (insertar al inicio de 3.3.3, antes de las capturas de pantalla)

---

### 2.5. 3.4.2 Estructura del proyecto — demasiado superficial

Texto actual:

> "frontend/ — Proyecto Angular (componentes, servicios, módulos, modelos)"
> "backend/ — Servidor Node.js + Express (rutas, controladores, modelos Mongoose, middlewares)"

**Falta la estructura interna real.** Insertar el árbol de carpetas (en bloque de código monoespaciado), basado en el real:

```
gitlearn/
├── frontend/
│   └── src/app/
│       ├── core/
│       │   ├── guards/         (auth.guard, role.guard)
│       │   ├── interceptors/   (auth.interceptor)
│       │   ├── models/         (interfaces TS de dominio)
│       │   └── services/       (LessonService, ProgresoService, ...)
│       ├── features/
│       │   ├── auth/           (login, register, github-callback)
│       │   ├── lessons/        (dashboard, lesson-map, lesson-view, tareas)
│       │   ├── progress/
│       │   ├── teacher/        (lesson-list, lesson-editor, assign-modal)
│       │   └── admin/          (user-management, content-moderation)
│       ├── shared/             (topbar, utils)
│       └── app.routes.ts
├── backend/
│   └── src/
│       ├── controllers/        (auth, lecciones, ejercicios, progreso, asignaciones, admin)
│       ├── models/             (Usuario, Leccion, Ejercicio, Progreso, Insignia, Asignacion)
│       ├── routes/             (un router por recurso)
│       ├── middlewares/        (authMiddleware, roleMiddleware, errorHandler)
│       ├── services/           (lógica de negocio por dominio)
│       ├── validators/         (express-validator)
│       └── app.ts
├── docker-compose.yml
└── README.md
```

📷 **CAPTURAS de código relevantes** (1-2 por sección, no más):

- `backend/src/middlewares/authMiddleware.ts` (validación JWT, demuestra Passport+JWT)
- `backend/src/middlewares/roleMiddleware.ts` (factoría de middlewares por rol)
- `backend/src/services/progresoService.ts` función `calcularRacha` (lógica gamificación)
- `backend/src/services/asignacionesService.ts` función `getAsignacionesByEstudiante` (uso de aggregation/join con Progreso)
- `frontend/src/app/core/interceptors/auth.interceptor.ts` (patrón funcional Angular 17+, 8 líneas)
- `frontend/src/app/features/lessons/lesson-view/lesson-view.component.ts` un fragmento del render del ejercicio `emparejar` con `seededShuffle`
- `frontend/src/app/features/teacher/assign-modal/assign-modal.component.ts` el `combineLatest` con `refreshKey` (uso de signals + RxJS interop)

⚠️ **No metas capturas de código en imagen.** Usa bloques de código markdown / fuente monoespaciada en el documento. Capturas de **app sí**, capturas de **código no**.

---

### 2.6. **3.5 Validación y pruebas — APARTADO QUE NO EXISTE Y ES OBLIGATORIO**

La rúbrica de aspectos formales lo lista como un criterio independiente que vale **1 punto sobre 7** del bloque (no es trivial). Texto exacto del descriptor "Muy bien":

> "Se incluyen las validaciones de páginas de estilo, navegadores, enlaces, resolución, etc necesarias para la aplicación y algunas pruebas relativas al control de acceso y validación de datos de entrada."

Y además las **normas del módulo** lo listan como apartado obligatorio: "Pruebas".

**Crear apartado 3.5 con al menos estos sub-puntos:**

- **3.5.1 Validación de entrada de datos**
  - Frontend: validadores reactivos en formularios (registro, login, editor de lección)
  - Backend: `express-validator` en cada endpoint POST/PUT (mostrar `validators/asignacionValidators.ts` como ejemplo)
  - Sanitización (`trim()`, `maxlength`)

- **3.5.2 Control de acceso**
  - Tabla con cada endpoint protegido y qué rol(es) puede acceder
  - JWT + middleware `authMiddleware`
  - `roleMiddleware('profesor', 'administrador')` factory pattern
  - Guards en Angular (`authGuard`, `roleGuard`)
  - Pruebas manuales de intentos de acceso no autorizado: por ejemplo, usuario estudiante intenta `POST /api/lecciones` → respuesta 403

- **3.5.3 Pruebas de compatibilidad**
  - Navegadores probados (Chrome, Firefox, Edge — versiones)
  - Resolución mínima probada
  - Validación responsiva en tablet/móvil

- **3.5.4 Validación de página y estilos**
  - Validador HTML W3C
  - Linter ESLint sin errores
  - TypeScript en modo strict

- **3.5.5 Pruebas funcionales (manuales)**
  - Crear como mínimo una tabla con casos de prueba: ID, descripción, pasos, resultado esperado, resultado obtenido. 8-10 casos cubriendo: registro, login fallido, login OK, completar lección, intentar editar lección de otro profesor, asignar tarea, ver tarea como alumno, completar tarea asignada, etc.

📷 **CAPTURAS necesarias en este apartado:**

- Pantallazo de un error de validación en el formulario de registro (campo email inválido, contraseña corta)
- Pantallazo de la respuesta 403 desde el cliente REST/Postman al intentar acceder con rol incorrecto
- Pantallazo del HTML válido en el W3C validator
- Pantallazo de la consola limpia de errores tras una sesión completa

---

### 2.7. 4. Ampliación y posibles mejoras — está en `[PENDIENTE]`

**Redactar.** Líneas a incluir:

- **Recuperación de contraseña por email** (RF-05 documentado pero no implementado, `nodemailer` ya está como dependencia)
- **Estadísticas del profesor sobre los alumnos asignados** (% completado, nota media, tiempo medio por lección)
- **Integración real con la API de GitHub** (validar contra repositorios reales)
- **Generación de certificados** al completar todos los niveles
- **Soporte multiidioma** (i18n)
- **Modo retos / multijugador** entre estudiantes
- **Editor de tipo `emparejar` en el frontend del profesor** (actualmente el editor solo permite `opcionMultiple` y `rellenarHuecos` — los otros dos tipos solo se pueden crear directamente vía API)
- **Notificaciones in-app** cuando un profesor asigna una nueva tarea
- **Modo claro** (actualmente solo dark)

---

### 2.8. 5. Conclusiones — está en `[PENDIENTE]`

**Redactar.** Estructura sugerida (1-2 páginas):

- Repaso de objetivos cumplidos vs. propuestos (mapear contra los específicos de la sección 2.2)
- Aprendizajes técnicos: primer proyecto full-stack real, integración Angular + Express, autenticación con JWT y OAuth, modelado MongoDB, Docker Compose para entornos
- Aprendizajes no técnicos: gestión del tiempo, planificación incremental, importancia de documentar a la vez que se programa
- Dificultades encontradas y cómo se resolvieron (ejemplos concretos: tipado de respuestas Mongoose con `.lean()`, integración de signals con observables, gamificación de la racha diaria)
- Valoración personal del resultado y posibles vías de continuación

---

## 3. Aspectos formales (revisar antes de imprimir)

Según la rúbrica formal y las normas:

| Requisito                          | Estado                        | Acción                                                                                                                    |
| ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Tipo de letra Calibri 12 o similar | comprobar                     | revisar al maquetar                                                                                                       |
| Espaciado sencillo                 | comprobar                     | revisar al maquetar                                                                                                       |
| Doble cara                         | impresión                     | configurar al imprimir                                                                                                    |
| Color                              | comprobar                     | imprimir en color                                                                                                         |
| **Extensión 25–40 páginas**        | ⚠️ memoria actual ~19 páginas | ampliar con secciones nuevas (3.5 + capturas + estructura del proyecto + diagramas + redacción de mejoras y conclusiones) |
| Numeración de páginas              | comprobar                     | añadir si falta                                                                                                           |
| Encuadernado                       | impresión                     | encuadernar antes de entregar                                                                                             |
| Portada                            | ✓ presente                    | —                                                                                                                         |
| Índice                             | ✓ presente                    | actualizar tras añadir 3.5 y reorganizar                                                                                  |
| Bibliografía                       | ✓ presente                    | añadir referencias nuevas si usas alguna fuente más                                                                       |

---

## 4. Recomendaciones técnicas extra (opcionales pero suben nota)

La rúbrica de **contenidos (50%)** valora "Originalidad", "Actualidad", "Alternativas presentadas" y "Dificultad". Para reforzar:

- **Apartado de "Decisiones de diseño / alternativas consideradas"**, incluir en 3.4.1 o como subapartado independiente:
  - "Por qué Angular y no React/Vue" (TypeScript nativo, signals, OnPush, inject(), arquitectura standalone components)
  - "Por qué MongoDB y no PostgreSQL" (esquema flexible para tipos de ejercicios heterogéneos)
  - "Por qué JWT stateless y no sesiones server-side" (escalabilidad, integración con OAuth)
  - "Por qué Docker Compose y no despliegue manual" (portabilidad, paridad dev/prod)

- **Mostrar uso de patrones avanzados** en el apartado de implementación: standalone components, signals + computed, RxJS interop (`toSignal`/`toObservable`), `combineLatest` con refresh trigger, Express middleware factory, populate de Mongoose, agregaciones para JOIN-like.

---

## 5. Checklist final (orden recomendado)

Cuando vayas a hacer las correcciones, este es el orden más eficiente:

- [ ] **1.** Corregir incoherencias del modelo de datos (1.1, 1.2, 1.3)
- [ ] **2.** Corregir CU-02 (1.4)
- [ ] **3.** Decidir qué hacer con RF-05 y RF-14 (1.5, 1.6) → recomendado: moverlos a Ampliación
- [ ] **4.** Añadir todo el bloque de Asignaciones: RF, CU, colección, endpoints (1.7)
- [ ] **5.** Sustituir la tabla de endpoints por la lista completa (1.8)
- [ ] **6.** Crear los 4 diagramas que faltan (casos uso, clases, componentes, navegabilidad) → 2.1, 2.2, 2.3, 2.4
- [ ] **7.** Hacer las capturas de pantalla (2.4) — usar la app con datos reales y semilla
- [ ] **8.** Redactar 3.4.2 con el árbol real del proyecto (2.5)
- [ ] **9.** **Crear el apartado 3.5 Validación y pruebas (CRÍTICO, 1 punto)** (2.6)
- [ ] **10.** Redactar Ampliación y posibles mejoras (2.7)
- [ ] **11.** Redactar Conclusiones (2.8)
- [ ] **12.** Revisar formato (Calibri 12, espaciado, paginación, índice actualizado)
- [ ] **13.** Verificar extensión total (25–40 páginas)
- [ ] **14.** Lectura final por alguien externo al proyecto (recomendación de las normas)
- [ ] **15.** Imprimir a doble cara, en color, encuadernar

---

## 6. Resumen de capturas necesarias (lista plana)

Para que tengas todas juntas y puedas ir cazándolas en una sola sesión:

**Diagramas (creados en herramienta externa):**

1. Diagrama de casos de uso UML → 3.2.2
2. Diagrama de clases UML → 3.2.4
3. Diagrama de componentes / arquitectura → 3.3.1
4. Diagrama de navegabilidad / sitemap → 3.3.3

**Capturas de la aplicación en uso:** 5. Mapa de lecciones del estudiante 6. Vista de ejercicio (`emparejar` o `arrastrarSoltar`) 7. Pantalla de finalización con XP e insignia 8. **Página de Tareas asignadas (pendientes + completadas)** ← clave para justificar la nueva feature 9. Página de progreso (XP, racha, insignias) 10. Dashboard del profesor 11. Listado "Mis lecciones" con columna de acciones 12. Editor de lección con ejercicios 13. **Modal de asignación abierto** ← clave para la nueva feature 14. Dashboard del admin 15. Gestión de usuarios (admin)

**Capturas de validaciones y pruebas:** 16. Error de validación en formulario (registro con email inválido) 17. Respuesta 403 al intentar endpoint sin permisos (cliente REST) 18. W3C HTML validator OK 19. Consola del navegador sin errores

**No usar capturas para código** — usar bloques de código en monoespaciado dentro del documento.
