import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { CrearEjercicioDto, ExerciseService } from '../../../core/services/exercise.service';
import { CrearLeccionDto, LessonService, NivelLeccion } from '../../../core/services/lesson.service';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';

type ExerciseType = 'opcionMultiple' | 'rellenarHuecos';

interface DraftExercise {
  readonly localId: string;
  readonly _id?: string;
  readonly type: ExerciseType;
  readonly prompt: string;
  readonly opciones: readonly [string, string, string, string];
  readonly correct: string;
  readonly explicacion: string;
}

@Component({
  selector: 'app-lesson-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ReactiveFormsModule, TopbarComponent],
  template: `
    <div class="min-h-screen" style="background:var(--bg)">
      <app-topbar />

      <main class="gl-main" style="max-width:800px;margin:0 auto">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">
          <a routerLink="/profesor/lecciones"
             class="gl-btn gl-btn-sm gl-btn-ghost"
             style="padding:8px;border-radius:var(--r-md);flex-shrink:0"
             aria-label="Volver a mis lecciones">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </a>
          <div>
            <h1 class="gl-page-title">{{ isNew() ? 'Nueva lección' : 'Editar lección' }}</h1>
            <p class="gl-page-subtitle">{{ isNew() ? 'Crea contenido nuevo' : 'Modifica los datos y ejercicios' }}</p>
          </div>
        </div>

        @if (error()) {
          <div class="gl-alert gl-alert-error mb-6" role="alert">{{ error() }}</div>
        }

        <!-- Lesson form -->
        <section class="gl-card mb-6">
          <h2 class="text-sm font-bold mb-5" style="color:var(--text)">Datos de la lección</h2>
          <form [formGroup]="form" class="space-y-5">
            <div>
              <label for="titulo" class="gl-label">Título</label>
              <input id="titulo" type="text" formControlName="titulo"
                placeholder="Ej: Crear y cambiar ramas" class="gl-input"/>
            </div>
            <div>
              <label for="descripcion" class="gl-label">Descripción</label>
              <textarea id="descripcion" formControlName="descripcion" rows="3"
                placeholder="Breve resumen que verán los estudiantes en el mapa de lecciones."
                class="gl-input" style="resize:vertical;height:auto"></textarea>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label for="nivel" class="gl-label">Nivel</label>
                <select id="nivel" formControlName="nivel" class="gl-select">
                  <option value="básico">Básico</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                  <option value="experto">Experto</option>
                </select>
              </div>
              <div>
                <label for="xp" class="gl-label">XP recompensa</label>
                <input id="xp" type="number" formControlName="xp" min="0" max="500"
                  class="gl-input" style="font-family:monospace"/>
              </div>
              <div>
                <label for="orden" class="gl-label">Orden</label>
                <input id="orden" type="number" formControlName="orden" min="1"
                  class="gl-input" style="font-family:monospace"/>
              </div>
            </div>
          </form>
        </section>

        <!-- Exercises -->
        <section class="gl-card" style="padding:0;overflow:hidden">
          <header class="flex items-center justify-between p-6" style="border-bottom:1px solid var(--border)">
            <div>
              <h2 class="text-sm font-semibold" style="color:var(--text)">Ejercicios</h2>
              <p class="text-xs mt-1" style="color:var(--muted)">{{ exercises().length }} ejercicio(s) en esta lección.</p>
            </div>
            <button type="button" (click)="addExercise()" class="gl-btn gl-btn-sm gl-btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Añadir ejercicio
            </button>
          </header>

          <div>
            @for (ex of exercises(); track ex.localId; let i = $index) {
              <article class="p-6" [style.border-top]="i > 0 ? '1px solid var(--border-subtle)' : 'none'">
                <div class="flex items-center justify-between gap-4 mb-4">
                  <div class="flex items-center gap-3">
                    <span class="w-7 h-7 flex items-center justify-center text-xs font-mono flex-shrink-0"
                          style="border-radius:var(--r-sm);background:var(--surface2);border:1.5px solid var(--border);color:var(--text2)">
                      {{ i + 1 }}
                    </span>
                    <label [attr.for]="'type-' + ex.localId" class="sr-only">Tipo de ejercicio {{ i + 1 }}</label>
                    <select [id]="'type-' + ex.localId" [value]="ex.type"
                      (change)="setExerciseType(ex.localId, $event)"
                      class="gl-select" style="padding:6px 10px;font-size:12px;font-family:monospace;width:auto">
                      <option value="opcionMultiple">Opción múltiple</option>
                      <option value="rellenarHuecos">Rellenar huecos</option>
                    </select>
                  </div>
                  <button type="button" (click)="removeExercise(ex.localId)"
                    class="gl-btn gl-btn-sm gl-btn-danger flex-shrink-0"
                    [attr.aria-label]="'Eliminar ejercicio ' + (i + 1)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </div>

                <div class="space-y-4 pl-10">
                  <div>
                    <label class="gl-label" [attr.for]="'prompt-' + ex.localId">Enunciado</label>
                    <textarea [id]="'prompt-' + ex.localId" rows="2"
                      [value]="ex.prompt"
                      (input)="updateField(ex.localId, 'prompt', $event)"
                      placeholder="Escribe la pregunta o instrucción del ejercicio..."
                      class="gl-input" style="resize:vertical;height:auto"></textarea>
                  </div>

                  @if (ex.type === 'opcionMultiple') {
                    <fieldset>
                      <legend class="gl-label">
                        Opciones
                        <span style="color:var(--muted);font-weight:400;text-transform:none">— marca el botón junto a la correcta</span>
                      </legend>
                      <div class="space-y-2">
                        @for (opt of ex.opciones; track $index; let oi = $index) {
                          <div class="flex items-center gap-2">
                            <input type="radio" [name]="'correct-' + ex.localId"
                              [checked]="ex.correct !== '' && ex.correct === ex.opciones[oi]"
                              (change)="setCorrectByIndex(ex.localId, oi)"
                              class="flex-shrink-0 w-4 h-4" style="accent-color:var(--green)"
                              [attr.aria-label]="'Marcar opción ' + letterFor(oi) + ' como correcta'" />
                            <span class="font-mono text-xs w-4 flex-shrink-0" style="color:var(--muted)">{{ letterFor(oi) }}</span>
                            <input type="text" [value]="opt"
                              (input)="updateOption(ex.localId, oi, $event)"
                              [placeholder]="'Opción ' + letterFor(oi)"
                              class="gl-input" style="flex:1"/>
                          </div>
                        }
                      </div>
                    </fieldset>
                  }

                  @if (ex.type === 'rellenarHuecos') {
                    <div>
                      <label class="gl-label" [attr.for]="'correct-' + ex.localId">Respuesta correcta</label>
                      <input [id]="'correct-' + ex.localId" type="text"
                        [value]="ex.correct"
                        (input)="updateField(ex.localId, 'correct', $event)"
                        placeholder="Ej: git checkout -b feature"
                        class="gl-input" style="font-family:monospace"/>
                    </div>
                  }

                  <div>
                    <label class="gl-label" [attr.for]="'expl-' + ex.localId">
                      Explicación
                      <span style="color:var(--muted);font-weight:400;text-transform:none">(opcional — se muestra tras responder)</span>
                    </label>
                    <input [id]="'expl-' + ex.localId" type="text"
                      [value]="ex.explicacion"
                      (input)="updateField(ex.localId, 'explicacion', $event)"
                      placeholder="Ej: El flag -b crea la rama y hace checkout en un solo paso."
                      class="gl-input"/>
                  </div>
                </div>
              </article>
            } @empty {
              <div class="p-12 text-center">
                <p class="text-sm mb-2" style="color:var(--text2)">Todavía no hay ejercicios en esta lección.</p>
                <p class="text-xs" style="color:var(--muted)">Pulsa "Añadir ejercicio" para empezar.</p>
              </div>
            }
          </div>
        </section>

        <!-- Sticky save bar -->
        <div style="position:sticky;bottom:0;background:var(--bg);border-top:1.5px solid var(--border);padding:16px 0;display:flex;gap:12px;justify-content:flex-end;z-index:10;margin-top:20px">
          <a routerLink="/profesor/lecciones" class="gl-btn gl-btn-md gl-btn-ghost">Cancelar</a>
          <button type="button" [disabled]="saving()" (click)="saveDraft()"
            class="gl-btn gl-btn-md gl-btn-secondary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Guardar borrador
          </button>
          <button type="button" [disabled]="saving() || form.invalid" (click)="publish()"
            class="gl-btn gl-btn-md gl-btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0a1a00" stroke-width="2.5" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            {{ saving() ? 'Guardando…' : 'Publicar lección' }}
          </button>
        </div>
      </main>
    </div>
  `,
})
export class LessonEditorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly lessonService = inject(LessonService);
  private readonly exerciseService = inject(ExerciseService);

  private readonly routeId = this.route.snapshot.paramMap.get('id');

  readonly isNew = computed(
    () => !this.routeId || this.route.snapshot.url.at(-1)?.path === 'nueva',
  );

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    titulo:      ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
    nivel:       ['básico' as NivelLeccion, Validators.required],
    xp:          [30, [Validators.required, Validators.min(0), Validators.max(500)]],
    orden:       [1,  [Validators.required, Validators.min(0)]],
  });

  readonly exercises = signal<readonly DraftExercise[]>([]);
  private readonly deletedIds = signal<readonly string[]>([]);

  private readonly _loaded = toSignal(
    (() => {
      if (this.isNew() || !this.routeId) return of(null);
      return this.lessonService.getLeccion(this.routeId).pipe(
        switchMap((lesson) => {
          this.form.patchValue({
            titulo:      lesson.titulo,
            descripcion: lesson.descripcion,
            nivel:       lesson.nivel,
            xp:          lesson.xpRecompensa,
            orden:       lesson.orden,
          });
          return this.exerciseService.getEjercicios(lesson._id).pipe(catchError(() => of([])));
        }),
        catchError(() => of([])),
      );
    })(),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const exs = this._loaded();
      if (Array.isArray(exs) && exs.length > 0 && this.exercises().length === 0) {
        this.exercises.set(
          exs.map((e) => {
            const opts: [string, string, string, string] = ['', '', '', ''];
            e.opciones.forEach((o, i) => { if (i < 4) opts[i] = o; });
            return {
              localId:    e._id,
              _id:        e._id,
              type:       (e.tipo === 'opcionMultiple' ? 'opcionMultiple' : 'rellenarHuecos') as ExerciseType,
              prompt:     e.enunciado,
              opciones:   opts,
              correct:    Array.isArray(e.respuestaCorrecta)
                            ? e.respuestaCorrecta.join(',')
                            : e.respuestaCorrecta as string,
              explicacion: e.explicacion ?? '',
            };
          }),
        );
      }
    });
  }

  // ── Exercise mutations ─────────────────────────────────────────────────────

  addExercise(): void {
    const localId = `new-${Date.now()}`;
    this.exercises.update((list) => [
      ...list,
      { localId, type: 'opcionMultiple', prompt: '', opciones: ['', '', '', ''], correct: '', explicacion: '' },
    ]);
  }

  removeExercise(localId: string): void {
    const ex = this.exercises().find((e) => e.localId === localId);
    if (ex?._id) this.deletedIds.update((ids) => [...ids, ex._id!]);
    this.exercises.update((list) => list.filter((e) => e.localId !== localId));
  }

  setExerciseType(localId: string, event: Event): void {
    const type = (event.target as HTMLSelectElement).value as ExerciseType;
    this.exercises.update((list) =>
      list.map((e) => e.localId !== localId ? e : { ...e, type })
    );
  }

  updateField(localId: string, field: 'prompt' | 'correct' | 'explicacion', event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.exercises.update((list) =>
      list.map((e) => e.localId !== localId ? e : { ...e, [field]: value })
    );
  }

  updateOption(localId: string, idx: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.exercises.update((list) =>
      list.map((e) => {
        if (e.localId !== localId) return e;
        const newOpts = [...e.opciones] as [string, string, string, string];
        const wasCorrect = e.correct === e.opciones[idx];
        newOpts[idx] = value;
        return { ...e, opciones: newOpts, correct: wasCorrect ? value : e.correct };
      })
    );
  }

  setCorrectByIndex(localId: string, idx: number): void {
    this.exercises.update((list) =>
      list.map((e) => e.localId !== localId ? e : { ...e, correct: e.opciones[idx] })
    );
  }

  letterFor(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  saveDraft(): void { this.save('borrador'); }

  publish(): void {
    if (this.form.invalid) return;
    this.save('publicada');
  }

  private save(estado: 'borrador' | 'publicada'): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);

    const fv = this.form.getRawValue();
    const dto: CrearLeccionDto = {
      titulo:       fv.titulo,
      descripcion:  fv.descripcion,
      nivel:        fv.nivel,
      estado,
      xpRecompensa: fv.xp,
      orden:        fv.orden,
    };

    const lesson$ = this.isNew()
      ? this.lessonService.createLeccion(dto)
      : this.lessonService.updateLeccion(this.routeId!, dto);

    lesson$
      .pipe(
        switchMap((lesson) => {
          const exs     = this.exercises();
          const deleted = this.deletedIds();

          const creates = exs
            .filter((e) => !e._id)
            .map((e, idx) => {
              const d: CrearEjercicioDto = {
                leccionId:         lesson._id,
                tipo:              e.type,
                enunciado:         e.prompt,
                opciones:          e.type === 'opcionMultiple' ? [...e.opciones] : [],
                respuestaCorrecta: e.correct,
                explicacion:       e.explicacion,
                orden:             idx + 1,
              };
              return this.exerciseService.createEjercicio(d);
            });

          const updates = exs
            .filter((e) => !!e._id)
            .map((e, idx) =>
              this.exerciseService.updateEjercicio(e._id!, {
                tipo:              e.type,
                enunciado:         e.prompt,
                opciones:          e.type === 'opcionMultiple' ? [...e.opciones] : [],
                respuestaCorrecta: e.correct,
                explicacion:       e.explicacion,
                orden:             idx + 1,
              })
            );

          const deletes = deleted.map((id) =>
            this.exerciseService.deleteEjercicio(id).pipe(catchError(() => of(null)))
          );

          const all = [...creates, ...updates, ...deletes];
          return all.length ? forkJoin(all).pipe(catchError(() => of(null))) : of(null);
        }),
        catchError((err: { message?: string }) => {
          this.error.set(err?.message ?? 'Error al guardar la lección.');
          this.saving.set(false);
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result !== null || !this.error()) {
          void this.router.navigate(['/profesor/lecciones']);
        }
        this.saving.set(false);
      });
  }
}
