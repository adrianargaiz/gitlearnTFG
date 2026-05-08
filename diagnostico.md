````markdown
# Informe de revisión técnica de la app

La app tiene buenos cimientos:

- Estructura por features.
- Signals.
- Guards.
- Interceptor.
- Helmet.
- Rate-limit.
- Validators.
- Separación service/controller.
- JWT con `passwordHash select:false`.
- Idempotencia en `registrarLeccionCompletada`.
- Gating por estado `publicada` en lecciones públicas.

Como esqueleto MEAN para un TFG, el armazón se sostiene.

Pero el producto, hoy, está roto en el flujo más importante: ni el panel del profesor funciona, ni el editor de lecciones puede crear ejercicios válidos, ni el dashboard del alumno muestra lecciones completadas correctamente, ni el alumno se queda con la lección "actual" coherente entre sesiones.

Hay una desalineación grave entre lo que la UI promete y lo que el backend entrega. Campos como `updatedAt`, `ejerciciosCount`, `opciones`, `explicacion` y el endpoint `/lecciones/mias` simplemente no existen.

El diseño tampoco respeta el sistema declarado en `CLAUDE.md`: la paleta morada, Inter y JetBrains Mono no aparecen por ningún sitio. La implementación usa otro verde y otra gris. Además, la landing tiene cifras inventadas y enlaces muertos que cualquier reviewer crítico va a detectar en 5 segundos.

Antes de seguir puliendo UI, hay que arreglar el contrato API ↔ UI y desbloquear el flujo profesor → alumno end-to-end.

---

# 2. Diagnóstico por flujo de usuario

## A. Visitante → Landing → Registro → Login

1. `landing.component.html` muestra `"12.000+ estudiantes / 200+ ejercicios"`. Son cifras inventadas. Para un TFG/demo que se va a enseñar, esto resta credibilidad de inmediato.
2. El footer tiene tres `<a href="#">`: Privacidad, Términos y Contacto. Son pantallas que no existen, por tanto son links muertos.
3. Pulsar `"Comenzar gratis"` lleva a `/register`. El formulario funciona, valida bien y muestra password strength. Bien.
4. Si el usuario va a `/login` y pulsa `"¿Olvidaste tu contraseña?"`, el enlace apunta a `href="#"`. Otra promesa rota: si no existe, no lo enseñes.
5. Tras login correcto, `redirectByRole` redirige correctamente. Bien.
6. El callback de GitHub OAuth (`github-callback.component.ts`) funciona si hay token. Pero si Passport falla, en `authRouter.ts:65`, el `failureRedirect: '/login?error=oauth_failed'` es relativo al backend. En realidad redirige a:

   ```txt
   http://localhost:3000/login?error=oauth_failed
   ```
````

Esto provoca un 404 del backend. Todo el flujo de error de OAuth está roto silenciosamente.

---

## B. Estudiante → Dashboard → Lecciones → Lección → Progreso

1. `dashboard.component.ts` carga progreso y construye `completedIds`. Pero el backend populariza `leccionId` en `progresoService.ts:27`:

   ```ts
   .populate('leccionId', 'titulo nivel xpRecompensa')
   ```

   Por tanto, en runtime, `p.leccionId` es un objeto, no un string. El frontend lo trata como string.

   Resultado:
   - `completedIds` contiene objetos.
   - `completed.has(l._id)` con un string nunca matchea.
   - Siempre dice `"0 completadas"`.
   - La `"Lección actual"` siempre es la primera.
   - Las `"Lecciones recientes"` siempre están vacías.

   Bug crítico oculto detrás de tipos optimistas.

2. `lesson-map.component.ts` sufre el mismo problema:

   ```ts
   progreso.filter(...).map(p => p.leccionId)
   ```

   Recibe objetos populados, así que todas las lecciones aparecen como `"actual"` / `"bloqueada"`, y ninguna se marca como completada.

3. `lesson-view.component.ts` tiene varios problemas:
   - Solo renderiza `opcionMultiple` y `rellenarHuecos`. Si una lección tiene un `arrastrarSoltar`, que el backend acepta y el editor anuncia como tipo válido, la pantalla queda en blanco con el header de progreso, sin manera de avanzar.
   - `rellenarHuecos` compara con `===` puro:

     ```txt
     "git add ." !== "git add . "
     "git add ." !== "GIT ADD ."
     ```

     Falsos negativos garantizados. Falta `trim()` y normalización.

   - `previous()` reinicia `selected/submitted`. Al volver a un ejercicio anterior, pierdes tu respuesta y no ves si era correcta. UX inconsistente con el progreso visual.
   - `finishLesson()` siempre envía:

     ```ts
     xpObtenido: les.xpRecompensa;
     ```

     Aunque el alumno haya fallado el 100% de los ejercicios. El backend ignora el valor — bien —, pero la UI debería al menos mostrar puntuación. No hay umbral mínimo, no hay score.

   - El botón `"Comprobar"` es decorativo: puedes pulsar `"Siguiente"` sin haber acertado.
   - Usa `route.snapshot.paramMap` y no `paramMap` observable. Si Angular reusa el componente entre `/app/lecciones/A` y `/app/lecciones/B`, el `lessonId` no se actualiza.
   - `currentIndex` es signal local y no se persiste. Recargar pierde el progreso intra-lección.

4. `progress.component.ts` sufre el mismo bug del `populate` en `levelStats` y `completionPct`. Los datos aparecen siempre al 0%.

5. La racha se pinta en el topbar y aquí, pero como no se marca ninguna lección como completada en la UI, el alumno nunca verá la racha incrementar en la sesión actual. El backend sí la actualiza; el problema afecta a lo mostrado tras refrescar.

---

## C. Profesor → Dashboard → Mis lecciones → Editor

1. `getMisLecciones()` llama a:

   ```http
   GET /api/lecciones/mias
   ```

   Ese endpoint no existe.

   Express interpreta `mias` como `:id`, llama a `obtenerLeccion('mias')`, falla `Types.ObjectId.isValid` y devuelve `400`.

   El interceptor del frontend no maneja errores:

   ```ts
   catchError(of([]));
   ```

   Resultado:
   - `signal = []`
   - El dashboard del profesor y la lista de lecciones siempre están vacíos o en `"Cargando..."`
   - El profesor literalmente no puede ver nada de lo que ha creado.

   Bloqueante absoluto.

2. `lesson-editor.component.ts` está incompleto en varias dimensiones:
   - No hay selector de tipo de ejercicio. Todos los ejercicios se crean con:

     ```ts
     type: "opcionMultiple";
     ```

   - No hay campo `opciones` en el formulario, pero `ejerciciosRouter.ts:22` valida:

     ```ts
     body("opciones").isArray();
     ```

     como obligatorio.

     Resultado: `422` al guardar. El profesor nunca puede crear un ejercicio.

   - No hay campo `explicacion` ni tipo editables. Sin embargo, el alumno usa `ex.explicacion` en feedback. Las explicaciones no llegan jamás.

   - El patrón del constructor:

     ```ts
     const _ = computed(() => { ... });
     void _;
     ```

     es inerte. Una `computed` que nadie lee no se evalúa.

     En modo edición, los ejercicios cargados desde el backend nunca se vuelcan al signal local. El profesor ve la lección, pero los ejercicios aparecen vacíos y, si guarda, los borra, porque `deletedIds` no se llena pero los `_id` originales se olvidan.

   - `saveDraft()` no valida nada. Puedes guardar un borrador con título vacío.

   - `routeId = paramMap.get('id')` solo se lee una vez. Al navegar de `"nueva"` a editar sin recarga, `isNew()` mantiene la respuesta vieja.

3. Backend `updateLeccion` (`leccionesService.ts:60`) rechaza con `409` cualquier edición a una lección que no esté en borrador.

   Una vez publicada, ya no se puede tocar nunca más: ni corregir un typo, ni añadir un ejercicio.

   Combinado con que `cambiarEstadoLeccion` solo está en `/admin`, el profesor no puede ni `"despublicar"`.

   Brick total post-publish.

---

## D. Administrador → Dashboard → Usuarios → Contenido

1. `UserManagementComponent` y `ContentModerationComponent` repiten el mismo patrón inerte:

   ```ts
   const _ = computed(() => { ... });
   void _;
   ```

   `localUsers` / `localLessons` empiezan vacíos y nunca se sincronizan.

   El primer render usa `users()` desde servidor, pero en cuanto el admin pulsa cualquier botón (`toggleActive`, `onRolChange`, `onStatusChange`), ocurre esto:

   ```ts
   localUsers.update(list => list.map(...))
   ```

   Como actualiza un array vacío, la tabla queda con 0 o 1 elemento. Además, `filtered()` cambia de fuente porque `localUsers().length > 0`.

   Resultado: la tabla colapsa a 1 fila tras el primer click. Bug bestial.

2. `cambiarEstadoUsuario` y `cambiarRolUsuario` permiten al admin cambiarse a sí mismo el rol/estado y dejar la app sin admins.

   Falta un check tipo:

   ```ts
   if (id === req.user.userId) ...
   ```

3. Toda la columna `"Actualizada"` / `updatedAt` muestra `—` o cadena vacía porque `Leccion` no tiene timestamps en el schema:

   ```ts
   Leccion.ts:62: timestamps: false
   ```

   Lo mismo para `ejerciciosCount`: ningún endpoint lo calcula. La UI promete un dato que no existe.

---

# 3. Problemas críticos

| #   | Problema                                                                                        | Impacto                                                                                            | Archivo / zona                                                                                              | Solución                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Endpoint `GET /lecciones/mias` no existe                                                        | Profesor no ve nada. Feature completa muerta                                                       | `backend/src/routes/leccionesRouter.ts`, `frontend/.../lesson.service.ts:43`                                | Crear ruta `GET /mias` con auth + rol profesor/admin antes de `/:id`. Controller que filtre por `autorId === req.user.userId`                                       |
| C2  | Editor sin selector de tipo, sin opciones y sin explicación                                     | El profesor no puede crear ejercicios válidos. Backend devuelve `422` por `opciones isArray`       | `lesson-editor.component.ts`, bloque ejercicios; `ejerciciosRouter.ts:22`                                   | Añadir `<select>` para tipo, editor de opciones condicional al tipo y textarea `explicacion`. Hacer `opciones` opcional cuando `tipo === 'rellenarHuecos'`          |
| C3  | `_loaded/localUsers/localLessons` con `computed` que nadie lee                                  | Editor no carga ejercicios al editar. Tablas de admin colapsan al primer click                     | `lesson-editor.component.ts:228`, `user-management.component.ts:159`, `content-moderation.component.ts:135` | Sustituir por `effect()` o por `tap()` directo en el observable que sí se materializa con `toSignal`                                                                |
| C4  | `progreso.leccionId` viene populado como objeto, pero frontend lo trata como string             | Dashboard alumno y mapa siempre muestran 0 completadas. Gating visual roto. XP por nivel siempre 0 | `progresoService.ts:27`, `dashboard/lesson-map/progress.component.ts`                                       | Quitar el `.populate` o usar `(p.leccionId as any)._id ?? p.leccionId`. Tipar `Progreso.leccionId` como `string \| { _id: string }`                                 |
| C5  | Vista de lección no implementa `arrastrarSoltar`                                                | Si una lección incluye este tipo válido en schema/backend, la pantalla queda muda                  | `lesson-view.component.ts:57-95`                                                                            | Añadir bloque para `arrastrarSoltar` con DnD básico, por ejemplo Angular CDK. Si aún no se soporta, quitarlo del enum del backend y del editor                      |
| C6  | `updateLeccion` solo permite editar si `estado === 'borrador'`                                  | Tras publicar no puedes ni corregir un typo. Brick post-publish                                    | `leccionesService.ts:60`                                                                                    | Permitir edición de campos no estructurales aunque esté publicada, exponer `"despublicar"` al profesor o separar endpoints `PUT /:id/contenido` y `PUT /:id/estado` |
| C7  | `Leccion` sin timestamps. UI muestra `updatedAt` y `ejerciciosCount` que backend nunca devuelve | Columnas `"Actualizada"` y `"Ejercicios"` siempre vacías. Ordenación por fecha no funciona         | `Leccion.ts:62` y services backend                                                                          | Activar `{ timestamps: true }` y devolver `updatedAt`. Calcular `ejerciciosCount` con aggregate o `Promise.all` + `countDocuments`                                  |
| C8  | `POST /api/progreso` no comprueba prerequisitos ni intentos reales                              | Cualquier alumno puede hacer curl y completar todas las lecciones para farmear XP/insignias        | `progresoController.ts`, `progresoService.ts:32`                                                            | Verificar lección anterior completada. Opcionalmente recibir respuestas y validarlas en backend                                                                     |
| C9  | Admin puede cambiarse el rol o desactivarse a sí mismo                                          | Posible lockout del sistema sin admin                                                              | `adminController.ts:17,32`                                                                                  | `if (req.params.id === req.user.userId) throw createError('No puedes modificarte a ti mismo', 400)`                                                                 |
| C10 | `failureRedirect: '/login?error=oauth_failed'` apunta al backend, no al frontend                | Si OAuth falla, usuario aterriza en 404 del backend                                                | `authRouter.ts:65`                                                                                          | Usar URL absoluta: `` `${process.env.FRONTEND_URL}/login?error=oauth_failed` ``                                                                                     |

---

# 4. Problemas medios

| #   | Problema                                                                                                           | Impacto                                                                                                  | Archivo / zona                                                            | Solución                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | `rellenarHuecos` compara con `===` literal                                                                         | Falsos errores por mayúsculas/espacios. Usuario frustrado                                                | `lesson-view.component.ts:218`                                            | `selected().trim().toLowerCase() === ex.respuestaCorrecta.trim().toLowerCase()`                                                                                  |
| M2  | `previous()` resetea respuesta y resultado al volver                                                               | Pérdida de estado. UX inconsistente                                                                      | `lesson-view.component.ts:263`                                            | Mantener un `Map<index, { selected, submitted }>` o array paralelo                                                                                               |
| M3  | XP completo aunque falles todos los ejercicios                                                                     | Gamificación vacía. Medir esfuerzo no mide nada                                                          | `lesson-view.component.ts:270`, `progresoService.ts:59`                   | Trackear aciertos/total en frontend y enviarlo. Backend pondera XP o exige umbral mínimo                                                                         |
| M4  | No hay interceptor 401                                                                                             | Token expirado = errores silenciosos en cada request. El usuario ve la app, pero nada carga              | `auth.interceptor.ts`                                                     | Interceptor de respuesta: si `401`, `authService.logout()` y redirigir a login con mensaje                                                                       |
| M5  | `route.snapshot.paramMap` en lesson-view y editor                                                                  | Reuso de ruta no actualiza. Navegar entre lecciones puede mostrar la anterior                            | `lesson-view.component.ts:193`, `lesson-editor.component.ts:184`          | Usar `route.paramMap` observable + `switchMap`                                                                                                                   |
| M6  | `saveDraft()` no valida formulario                                                                                 | Borradores con título vacío saltan al servidor y generan `422` confuso                                   | `lesson-editor.component.ts:281`                                          | Mismo gate que `publish()` para campos críticos, como título mínimo                                                                                              |
| M7  | Topbar dropdown no se cierra al click fuera                                                                        | UX gremlin clásico                                                                                       | `topbar.component.ts`                                                     | `@HostListener('document:click')` u overlay-trigger                                                                                                              |
| M8  | `lesson-list.component.ts:188` hace `window.location.reload()` tras delete                                         | Refresca toda la app, pierde scroll y parpadea                                                           | `lesson-list.component.ts:188`                                            | Mantener `lessons` como signal mutable: `update(list => list.filter(...))`                                                                                       |
| M9  | Optimistic updates en admin sin rollback ante error                                                                | Si el PUT falla, la UI mantiene estado optimista pero el backend no                                      | `user-management.component.ts:208`, `content-moderation.component.ts:166` | En error del subscribe, revertir el cambio en `localUsers`                                                                                                       |
| M10 | `expressLimit: 10kb` para body                                                                                     | Lecciones con descripciones largas o muchos ejercicios podrían rebotar, sobre todo cuando metas markdown | `app.ts:40`                                                               | Subir a `100kb` o tener límites por endpoint                                                                                                                     |
| M11 | `respuestaCorrecta` se sirve al cliente en GET `/ejercicios/:leccionId`                                            | Cualquiera ve la respuesta en DevTools                                                                   | `ejerciciosService.ts:23`, controller                                     | Para una app pedagógica no es trágico, pero sí razón para validación servidor: cliente envía respuesta, backend valida y nunca expone la correcta hasta resolver |
| M12 | `bcryptjs` puro JS en lugar de `bcrypt` nativo                                                                     | Más lento. No crítico                                                                                    | `package.json` backend                                                    | Cambiar a `bcrypt` nativo si lo permite la imagen Docker                                                                                                         |
| M13 | `dist/` versionado en `backend/`                                                                                   | Ensucia repo. Riesgo de servir builds viejos                                                             | `backend/dist`                                                            | Añadir a `.gitignore` y recompilar en build de Docker                                                                                                            |
| M14 | Archivo `Puesto de trabajo seguro - Programa KIT DIGITAL · Ecomputer.html` de 455 KB y `SESSION_PROMPT.md` en raíz | Basura en el repo de un TFG. El tribunal lo verá                                                         | Raíz                                                                      | Borrarlos o moverlos fuera del repo                                                                                                                              |

---

# 5. Mejoras de UX/UI

1. Paleta inconsistente con `CLAUDE.md`.

   El documento declara:
   - Fondo: `#0D1117`
   - Surfaces: `#161B22`
   - Gradiente violeta: `#7C3AED → #4F46E5`
   - Success: `#10B981`
   - Fuentes: Inter + JetBrains Mono

   La app usa `#0F1115`, `#181B20`, `#22262D`, verde `#2ECC71` y ninguna fuente importada.

   Decide: o actualizas `CLAUDE.md` a lo que has implementado, o aplicas el sistema declarado. Hoy no hay un solo gradiente violeta en toda la app.

2. Tipografía: `index.html` no carga Inter ni JetBrains Mono. Cae a system fonts. Cambia drásticamente la `"premium dev tool feel"` prometida.

3. Topbar XP/streak se oculta en mobile con `hidden sm:flex`. Es la métrica clave de la app gamificada. Debería verse al menos como icono + número en mobile.

4. `lesson-view` no muestra título de la lección en grande ni ningún contexto. Solo pone un microtexto en el header de progreso. Falta jerarquía:
   - Título de lección.
   - Número de ejercicio, por ejemplo `Ejercicio 2 de 5`.
   - Tipo.
   - Prompt.

5. No hay feedback agregado de `"respuesta acertada/fallida"` al final. Tras finalizar, el alumno se va a `/app/lecciones` sin ningún resumen:

   ```txt
   Has acertado 4/5
   +30 XP
   Racha: 3 días
   +1 insignia
   ```

   Es la pantalla más importante de retención y no existe.

6. Estados vacíos pobres. `lesson-map` con 0 lecciones dice `"Cargando lecciones..."`. Si el backend devolvió `[]`, no es un error de carga: es un estado vacío. Hay que diferenciar loading vs empty en signals.

7. Mensajes de error genéricos del tipo:

   ```txt
   Error al iniciar sesión. Inténtalo de nuevo.
   ```

   El back ya devuelve mensajes accionables. Se usa `err.error?.message`, pero al fallar la red completa cae al fallback. Está bien como fallback, pero no hay distinción visual entre `401`, `422` y `500`.

8. Confirmaciones nativas con `confirm()` en `deleteLesson`. Muy 2008. Rompen la estética. Mejor usar Angular Material o un componente propio.

9. Landing:
   - Cifras inventadas: quítalas o pon métricas reales, por ejemplo `"4 niveles · 2 tipos de ejercicio"`.
   - Footer con `href="#"`: enlazar a páginas reales o quitar.
   - Botón `"Comenzar gratis"` repetido tres veces. El de la barra puede ser solo `"Empezar"`.

10. Login/Register usa anchura `max-w-sm` de 384px. Es un pelín apretado en desktop. `max-w-md` de 448px respira más.

11. Dashboard estudiante: `"Continúa tu aprendizaje"` desaparece cuando todas las lecciones están completadas. Falta un estado tipo:

    ```txt
    Has completado el camino. Sigue practicando.
    ```

12. Progress page: barra por nivel, pero sin total global encima. Falta una barra `"global"` con porcentaje de avance.

13. Editor profesor: la barra de acciones tiene `"Guardar borrador"` y `"Publicar"` sin distinguir crear vs editar. Si edito una publicada, `"Publicar"` no tiene sentido.

14. Responsive admin: tablas con `overflow-x-auto`, pero sin priorizar columnas. En mobile se vuelve un scroll-fest. Considerar formato card en `<md`.

15. Accesibilidad:
    - Confirmar `lang="es"` en `index.html`.
    - Añadir foco visible distintivo en botones, por ejemplo `focus-visible:ring`.

---

# 6. Riesgos técnicos

1. Contrato API ↔ Frontend frágil.

   Las interfaces TS del frontend declaran campos como:
   - `updatedAt`
   - `ejerciciosCount`
   - `_id` como string en `leccionId`

   Pero el backend no los garantiza.

   Sin validación runtime con Zod, io-ts o class-validator, cada cambio de schema introducirá bugs invisibles como C4.

   Considerar generar tipos compartidos: workspace TS o codegen desde Mongoose.

2. Anti-cheat inexistente.

   Cualquier usuario autenticado puede hacer:

   ```http
   POST /api/progreso
   ```

   con:

   ```json
   {
     "leccionId": "..."
   }
   ```

   para cualquier lección publicada y ganar XP + insignias sin haber tocado un ejercicio.

   Para un aprendizaje serio, hace falta verificar respuestas server-side.

3. JWT en `localStorage` → vulnerable a XSS.

   Hay `helmet()` general, pero no una CSP estricta. Cualquier inyección en una descripción de lección podría exfiltrar tokens.

   Evaluar:
   - Cookies `httpOnly` + CSRF token.
   - O, al menos, blindar CSP.

4. GitHub OAuth account-linking silencioso.

   En `authService.ts:79`, si ya existe un usuario con ese email, se le añade `githubId` sin confirmación.

   Una persona podría reclamar la cuenta de otra creando un GitHub con email coincidente.

   Para un TFG es discutible. En producción es vulnerabilidad de pre-toma de cuentas.

5. `updateLeccion` bloqueando siempre tras publicar implica que para corregir contenido el flujo real sería:
   1. Archivar.
   2. Crear nueva lección.
   3. Republicar.

   Eso no escala con un catálogo de lecciones.

6. No hay paginación en `getAllUsuarios` ni `getAllLecciones` del admin.

   Con 5.000 usuarios el dashboard cae. Para un TFG, marca el TODO. En producto, blocker.

7. Sin tests unitarios ni e2e.

   `app.spec.ts` está, pero no hay tests para:
   - Services.
   - Guards.
   - Controladores.
   - Modelos.

   Para defender un TFG técnico es un punto débil. Añadir aunque sea 5-10 tests representativos levanta mucho la nota:
   - Auth.
   - Progreso.
   - Role guard.
   - Auth interceptor.

8. Logging crudo a `console.error` en `errorHandler`.

   En producción, ningún sistema de observabilidad. Aceptable en TFG, pero documentado como deuda.

9. Patrón anti-Angular:

   ```ts
   const _ = computed(() => { ... });
   void _;
   ```

   Además de no funcionar, demuestra desconocimiento del modelo de reactividad.

   Migrar a `effect()` con la misma intención y borrar este patrón en los 4 sitios donde aparece.

10. `route.snapshot` por todas partes.

    Bloquea reuso de componentes y dificulta deep-linking dinámico.

    Estandarizar:

    ```ts
    route.paramMap.pipe(
      switchMap(...)
    )
    ```

11. Falta de seed/fixtures.

    No se ve un script para poblar DB con lecciones, ejercicios e insignias. Sin eso, nadie puede probar la app sin meterse a Mongo a mano.

    Bloqueante para defensa.

12. Docker.

    Se ha visto `docker-compose.yml` referenciado, pero no examinado en detalle. Hay que verificar:
    - `MONGO_INITDB_DATABASE`.
    - Persistencia.
    - Dockerfile del backend, que parece muy minimalista.

---

# 7. Quick wins

Lista priorizada por valor entregado vs tiempo:

1. Crear `GET /lecciones/mias` — 15 min.

   Desbloquea profesor entero. Solo controller + ruta nueva en `leccionesRouter.ts` antes de `/:id`.

2. Activar `timestamps: true` en `Leccion` y `Ejercicio` — 5 min.

   Después, devolver `ejerciciosCount` en `getLeccionesPublicadas` y `getAllLecciones` con aggregate — 30 min.

   Elimina `—` de toda la UI.

3. Fix del `progreso.leccionId populate` — 10 min.

   Quitar `.populate` en `progresoService.ts:27` o ajustar el frontend a leer `_id` cuando venga objeto.

   Desbloquea dashboard, mapa y progreso del alumno.

4. Añadir selector de tipo, opciones y explicación al editor — 1-2 h.

   Ahora mismo el editor es decorativo.

5. Reemplazar el patrón:

   ```ts
   const _ = computed(() => {});
   ```

   por `effect()` en:
   - `lesson-editor`
   - `user-management`
   - `content-moderation`

   Tiempo estimado: 30 min total.

6. Trim + lowercase en comparativa de `rellenarHuecos` — 5 min.

   Quita la mayor fricción del estudiante.

7. Interceptor 401 → logout — 15 min.

8. Quitar cifras inventadas de la landing y los `href="#"` muertos — 10 min.

   Lo notará el primer reviewer.

9. Cargar Inter + JetBrains Mono en `index.html` o decidir oficialmente que el sistema es otro y actualizar `CLAUDE.md` — 15 min.

10. Borrar archivos huérfanos del repo:
    - `Puesto de trabajo seguro... .html`
    - `SESSION_PROMPT.md`
    - `backend/dist`

    Y meterlos en `.gitignore` — 5 min.

11. Bloquear `/admin/usuarios/:id/{rol,estado}` cuando:

    ```ts
    id === req.user.userId;
    ```

    Tiempo estimado: 5 min.

12. Arreglar `failureRedirect` OAuth a URL absoluta — 2 min.

---

# 8. Roadmap recomendado

## Ahora

Esta semana, antes de tocar nada de UI nueva:

- C1: `/lecciones/mias`.
- C4: fix `populate` progreso.
- C2 + C3: editor de ejercicios:
  - Tipo.
  - Opciones.
  - Explicación.
  - `effect()`.

- C7: timestamps + `ejerciciosCount`.
- C8: prerequisito en `POST /progreso`, al menos lección anterior del mismo nivel completada.
- M1: trim/lowercase en `rellenarHuecos`.
- M4: interceptor 401.
- Quick wins 8, 10, 11 y 12.

---

## Después

Siguientes 1-2 semanas:

- C5: implementar `arrastrarSoltar` o eliminarlo del enum.
- C6: desbloquear edición post-publicación con un modelo realista.
- M2: mantener estado al volver atrás en lección.
- M3: score real y feedback resumen al finalizar.
- M9: rollback de optimistic updates.
- Resumen de lección al completar.
- Decidir y aplicar el sistema visual:
  - Paleta.
  - Tipografía.
  - Jerarquía.

- Seed script para lecciones, ejercicios e insignias.
- Tests críticos:
  - `authService`.
  - `progresoService`.
  - Role guard.
  - Auth interceptor.

---

## Más adelante

Cuando el flujo principal sea sólido:

- Validación server-side de respuestas.
- Anti-cheat real.
- Cookies `httpOnly` + CSRF.
- Paginación admin.
- Modal propio en lugar de `confirm()`.
- Account-linking GitHub con confirmación de email.
- Responsive admin con vista card en mobile.
- CSP estricta.
- Observabilidad mínima.
- Documentación técnica para defensa del TFG:
  - Diagrama de secuencia auth.
  - ER de datos.
  - Casos de uso.

---

# Veredicto rápido para el TFG

La arquitectura está bien planteada y se nota oficio en el backend:

- Services.
- Validators.
- `errorHandler`.
- JWT.
- Role middleware.

Pero el producto, a día de hoy, no puede ejecutarse end-to-end:

- El profesor no ve sus lecciones.
- El editor no crea ejercicios válidos.
- El alumno nunca marca lecciones como completadas en su dashboard.
- La admin colapsa al primer click.

Antes de cualquier sesión de polish visual, prioriza las 12 quick wins de la sección 7.

La mayoría son cambios de menos de 30 minutos y devuelven la app a un estado demoable.

```

```
