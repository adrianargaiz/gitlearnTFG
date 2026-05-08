import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, of, switchMap } from 'rxjs';
import { AsignacionService, EstudianteResumen } from '../../../core/services/asignacion.service';
import { Asignacion } from '../../../core/models/learning.model';

@Component({
  selector: 'app-assign-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop -->
    <div
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="'Asignar lección ' + leccionTitulo()"
      style="position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:24px"
      (click)="onBackdropClick($event)">

      <div style="position:absolute;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(2px)"></div>

      <div class="gl-card"
           style="position:relative;z-index:1;width:min(520px, calc(100vw - 24px));max-height:92vh;overflow-y:auto;padding:24px">

        <!-- Header -->
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:20px">
          <div>
            <h2 style="font-size:16px;font-weight:700;color:var(--text);margin:0 0 4px">
              Asignar lección
            </h2>
            <p style="font-size:13px;color:var(--muted);margin:0">{{ leccionTitulo() }}</p>
          </div>
          <button type="button" (click)="closed.emit()" class="gl-btn gl-btn-sm gl-btn-ghost"
                  aria-label="Cerrar" style="padding:5px;flex-shrink:0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Crear asignación -->
        <section style="margin-bottom:24px">
          <h3 style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin:0 0 12px">
            Nueva asignación
          </h3>

          <!-- Error cargando alumnos -->
          @if (loadError()) {
            <div style="padding:10px 14px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:var(--r-md);margin-bottom:10px">
              <p style="font-size:12px;color:var(--red);margin:0">{{ loadError() }}</p>
            </div>
          }

          <!-- Buscador alumnos -->
          <div style="position:relative;margin-bottom:10px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted)" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <label for="alumno-search" class="sr-only">Buscar alumno</label>
            <input id="alumno-search" type="search"
                   [value]="alumnoQuery()"
                   (input)="alumnoQuery.set(getInputValue($event))"
                   placeholder="Buscar alumno por nombre o email..."
                   class="gl-input" style="padding-left:2rem;font-size:13px" />
          </div>

          <!-- Lista de alumnos -->
          <div style="border:1px solid var(--border);border-radius:var(--r-md);max-height:200px;overflow-y:auto;background:var(--surface2)">
            @if (filteredEstudiantes().length === 0) {
              <div style="padding:20px;text-align:center;font-size:13px;color:var(--muted)">
                @if (loadError()) {
                  Error al cargar alumnos.
                } @else if (estudiantes().length === 0) {
                  No hay alumnos registrados en el sistema.
                } @else {
                  Sin resultados para "{{ alumnoQuery() }}".
                }
              </div>
            }
            @for (e of filteredEstudiantes(); track e._id) {
              <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border)"
                     [style.background]="selected().has(e._id) ? 'var(--green-bg)' : 'transparent'">
                <input type="checkbox" [checked]="selected().has(e._id)"
                       (change)="toggleEstudiante(e._id)" style="accent-color:var(--green)" />
                <div>
                  <div style="font-size:13px;font-weight:600;color:var(--text)">{{ e.nombre }}</div>
                  <div style="font-size:11px;color:var(--muted)">{{ e.email }}</div>
                </div>
              </label>
            }
          </div>

          @if (selected().size > 0) {
            <p style="font-size:12px;color:var(--green);margin-top:6px">
              {{ selected().size }} alumno{{ selected().size > 1 ? 's' : '' }} seleccionado{{ selected().size > 1 ? 's' : '' }}
            </p>
          }

          <!-- Fecha límite -->
          <div style="margin-top:14px">
            <label for="fecha-limite" style="display:block;font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px">
              Fecha límite <span style="color:var(--muted);font-weight:400">(opcional)</span>
            </label>
            <input id="fecha-limite" type="date"
                   [value]="fechaLimite()"
                   (input)="fechaLimite.set(getInputValue($event))"
                   class="gl-input" style="font-size:13px;max-width:200px" />
          </div>

          @if (createError()) {
            <p style="font-size:12px;color:var(--red);margin-top:8px">{{ createError() }}</p>
          }

          <button type="button"
                  [disabled]="selected().size === 0 || saving()"
                  (click)="crearAsignacion()"
                  class="gl-btn gl-btn-md gl-btn-primary"
                  style="margin-top:14px;width:100%">
            @if (saving()) { Guardando… } @else { Crear asignación }
          </button>
        </section>

        <!-- Asignaciones existentes -->
        <section>
          <h3 style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin:0 0 12px">
            Asignaciones existentes
          </h3>

          @if (existentes().length === 0) {
            <p style="font-size:13px;color:var(--muted)">Ninguna todavía.</p>
          }

          <div style="display:flex;flex-direction:column;gap:8px">
            @for (a of existentes(); track a._id) {
              <div class="gl-card" style="padding:12px 14px;background:var(--surface2)">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
                  <div>
                    <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px">
                      {{ estudiantesLabel(a) }}
                    </div>
                    @if (a.fechaLimite) {
                      <div style="font-size:11px;color:var(--muted)">
                        Límite: {{ formatDate(a.fechaLimite) }}
                      </div>
                    }
                    <div style="font-size:11px;color:var(--muted)">
                      Asignada {{ formatDate(a.fechaAsignacion) }}
                    </div>
                  </div>
                  <button type="button" (click)="eliminarAsignacion(a._id)"
                          class="gl-btn gl-btn-sm gl-btn-danger"
                          [disabled]="deletingId() === a._id"
                          aria-label="Eliminar asignación">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
})
export class AssignModalComponent {
  private readonly asignacionService = inject(AsignacionService);

  readonly leccionId = input.required<string>();
  readonly leccionTitulo = input<string>('');
  readonly closed = output<void>();
  readonly assigned = output<void>();

  readonly saving = signal(false);
  readonly createError = signal('');
  readonly loadError = signal('');
  readonly deletingId = signal<string | null>(null);
  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly alumnoQuery = signal('');
  readonly fechaLimite = signal('');
  private readonly refreshKey = signal(0);

  readonly estudiantes = toSignal(
    this.asignacionService.getEstudiantes().pipe(
      catchError((err: { status?: number; error?: { message?: string } }) => {
        const msg =
          err?.status === 403
            ? 'Sin permiso para cargar alumnos.'
            : err?.error?.message ?? `Error ${err?.status ?? ''} al cargar alumnos.`;
        this.loadError.set(msg);
        return of([] as EstudianteResumen[]);
      })
    ),
    { initialValue: [] as EstudianteResumen[] }
  );

  readonly filteredEstudiantes = computed(() => {
    const q = this.alumnoQuery().toLowerCase().trim();
    if (!q) return this.estudiantes();
    return this.estudiantes().filter(
      (e) => e.nombre.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    );
  });

  readonly existentes = toSignal(
    combineLatest([toObservable(this.leccionId), toObservable(this.refreshKey)]).pipe(
      switchMap(([id]) =>
        this.asignacionService.getAsignacionesPorLeccion(id).pipe(catchError(() => of([])))
      )
    ),
    { initialValue: [] as Asignacion[] }
  );

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  toggleEstudiante(id: string): void {
    this.selected.update((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  crearAsignacion(): void {
    if (this.selected().size === 0 || this.saving()) return;
    this.saving.set(true);
    this.createError.set('');

    this.asignacionService
      .createAsignacion({
        leccionId: this.leccionId(),
        estudiantesIds: [...this.selected()],
        fechaLimite: this.fechaLimite() || undefined,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.selected.set(new Set());
          this.fechaLimite.set('');
          this.refreshKey.update((k) => k + 1);
          this.assigned.emit();
        },
        error: (err: { error?: { message?: string } }) => {
          this.saving.set(false);
          this.createError.set(err?.error?.message ?? 'Error al crear la asignación.');
        },
      });
  }

  eliminarAsignacion(id: string): void {
    this.deletingId.set(id);
    this.asignacionService.deleteAsignacion(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.refreshKey.update((k) => k + 1);
      },
      error: () => this.deletingId.set(null),
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closed.emit();
  }

  estudiantesLabel(a: Asignacion): string {
    const ids = a.estudiantesIds;
    if (ids.length === 0) return 'Sin alumnos';
    const list = this.estudiantes();
    const nombres = ids
      .slice(0, 3)
      .map((id) => list.find((e) => e._id === id)?.nombre ?? '...')
      .join(', ');
    return ids.length > 3 ? `${nombres} y ${ids.length - 3} más` : nombres;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
