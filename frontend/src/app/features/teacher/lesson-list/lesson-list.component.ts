import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import {
  LESSON_LEVEL_COLOR,
  LESSON_STATUS_BADGE_CLASS,
  LESSON_STATUS_LABEL,
} from '../../../core/constants/learning.constants';
import { EstadoLeccion, Leccion, LessonService } from '../../../core/services/lesson.service';
import { AssignModalComponent } from '../assign-modal/assign-modal.component';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { formatShortDate } from '../../../shared/utils/format-date';

type StatusFilter = 'todas' | EstadoLeccion;

interface AssignTarget {
  readonly id: string;
  readonly titulo: string;
}

@Component({
  selector: 'app-lesson-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TopbarComponent, AssignModalComponent],
  template: `
    <div class="min-h-screen" style="background:var(--bg)">
      <app-topbar />

      <main class="gl-main" style="max-width:1000px;margin:0 auto">
        <header class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 class="gl-page-title">Mis lecciones</h1>
            <p class="gl-page-subtitle">{{ all().length }} lecciones en total</p>
          </div>
          <a routerLink="/profesor/lecciones/nueva" class="gl-btn gl-btn-md gl-btn-primary flex-shrink-0 self-start">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva lección
          </a>
        </header>

        <!-- Filters row -->
        <div class="flex items-center gap-3 mb-5 flex-wrap">
          <div class="gl-tabs">
            @for (f of filterOptions; track f.value) {
              <button type="button" (click)="filter.set(f.value)"
                class="gl-tab" [class.active]="filter() === f.value">
                {{ f.label }}
                <span class="ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                      [style.background]="filter() === f.value ? 'var(--surface3)' : 'rgba(255,255,255,0.06)'"
                      [style.color]="filter() === f.value ? 'var(--muted)' : 'var(--grey)'">{{ count(f.value) }}</span>
              </button>
            }
          </div>

          <div class="relative flex-1" style="max-width:20rem">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 class="absolute left-3 top-1/2 -translate-y-1/2" style="color:var(--muted)" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <label for="search" class="sr-only">Buscar lección</label>
            <input id="search" type="search" [value]="query()" (input)="onQuery($event)"
              placeholder="Buscar por título..."
              class="gl-input" style="padding-left:2.25rem"/>
          </div>
        </div>

        <!-- Table -->
        <div class="gl-card" style="padding:0;overflow:hidden">
          <table class="gl-table" style="width:100%;table-layout:auto">
            <thead>
              <tr>
                <th scope="col">Lección</th>
                <th scope="col" style="width:1%;white-space:nowrap">Nivel</th>
                <th scope="col" style="width:1%;white-space:nowrap">Estado</th>
                <th scope="col" style="width:1%;white-space:nowrap;text-align:right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (lesson of filtered(); track lesson._id) {
                <tr>
                  <!-- Celda Lección: orden, título, descripción y meta (XP, ejercicios, fecha) -->
                  <td>
                    <div style="display:flex;flex-direction:column;gap:3px">
                      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                        <span style="font-family:monospace;font-size:11px;color:var(--muted);min-width:22px">#{{ lesson.orden }}</span>
                        <span style="font-weight:700;color:var(--text);font-size:14px">{{ lesson.titulo }}</span>
                      </div>
                      @if (lesson.descripcion) {
                        <div style="font-size:12px;color:var(--muted);line-height:1.4;max-width:540px">{{ lesson.descripcion }}</div>
                      }
                      <div style="display:flex;align-items:center;gap:14px;font-size:11px;color:var(--muted);margin-top:2px;flex-wrap:wrap">
                        <span style="display:inline-flex;align-items:center;gap:4px;color:var(--gold);font-weight:600">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                          {{ lesson.xpRecompensa }} XP
                        </span>
                        <span>{{ lesson.ejerciciosCount ?? 0 }} ejercicios</span>
                        @if (lesson.updatedAt) {
                          <span>· {{ formatDate(lesson.updatedAt) }}</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td style="white-space:nowrap">
                    <span class="gl-badge"
                          [style.color]="nivelColor(lesson.nivel)"
                          [style.borderColor]="nivelColor(lesson.nivel) + '40'"
                          [style.background]="nivelColor(lesson.nivel) + '18'">{{ lesson.nivel }}</span>
                  </td>
                  <td style="white-space:nowrap">
                    <span class="gl-badge" [class]="statusBadgeClass(lesson.estado)">{{ estadoLabel(lesson.estado) }}</span>
                  </td>
                  <td style="text-align:right;white-space:nowrap">
                    <div class="flex items-center justify-end gap-1">
                      <!-- Asignar -->
                      <button type="button" (click)="openAssign(lesson)"
                        class="gl-btn gl-btn-sm gl-btn-ghost"
                        title="Asignar a alumnos"
                        aria-label="Asignar lección a alumnos">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <line x1="23" y1="11" x2="17" y2="11"/>
                          <line x1="20" y1="8" x2="20" y2="14"/>
                        </svg>
                      </button>
                      <!-- Editar -->
                      <a [routerLink]="['/profesor/lecciones', lesson._id]"
                         class="gl-btn gl-btn-sm gl-btn-ghost" aria-label="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </a>
                      <!-- Eliminar -->
                      <button type="button" (click)="deleteLesson(lesson)"
                        [disabled]="lesson.estado === 'publicada'"
                        class="gl-btn gl-btn-sm"
                        [class]="lesson.estado === 'publicada' ? 'gl-btn-ghost' : 'gl-btn-danger'"
                        [attr.aria-label]="lesson.estado === 'publicada' ? 'Archiva primero para eliminar' : 'Eliminar'"
                        [attr.title]="lesson.estado === 'publicada' ? 'Archiva la lección antes de eliminarla' : undefined">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" style="text-align:center;padding:64px 16px">
                    <div class="flex flex-col items-center" style="color:var(--muted)">
                      <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                           style="background:var(--surface2);border:1.5px solid var(--border)">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </div>
                      <p class="text-sm font-semibold" style="color:var(--text2)">Sin resultados</p>
                      <p class="text-xs mt-1">No se encontraron lecciones con los filtros actuales</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </main>
    </div>

    <!-- Modal de asignación -->
    @if (assignTarget()) {
      <app-assign-modal
        [leccionId]="assignTarget()!.id"
        [leccionTitulo]="assignTarget()!.titulo"
        (closed)="assignTarget.set(null)"
        (assigned)="assignTarget.set(null)" />
    }
  `,
})
export class LessonListComponent {
  private readonly lessonService = inject(LessonService);

  readonly filter = signal<StatusFilter>('todas');
  readonly query = signal('');
  readonly assignTarget = signal<AssignTarget | null>(null);
  private readonly deletedIds = signal<ReadonlySet<string>>(new Set());

  readonly filterOptions: readonly { value: StatusFilter; label: string }[] = [
    { value: 'todas',     label: 'Todas' },
    { value: 'publicada', label: 'Publicadas' },
    { value: 'borrador',  label: 'Borradores' },
    { value: 'archivada', label: 'Archivadas' },
  ];

  readonly all = toSignal(
    this.lessonService.getMisLecciones().pipe(catchError(() => of([]))),
    { initialValue: [] as Leccion[] },
  );

  readonly filtered = computed(() => {
    const f = this.filter();
    const q = this.query().toLowerCase().trim();
    const deleted = this.deletedIds();
    return this.all().filter((l) => {
      if (deleted.has(l._id)) return false;
      const matchStatus = f === 'todas' || l.estado === f;
      const matchQuery  = !q || l.titulo.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  });

  count(filter: StatusFilter): number {
    const deleted = this.deletedIds();
    const src = this.all().filter((l) => !deleted.has(l._id));
    if (filter === 'todas') return src.length;
    return src.filter((l) => l.estado === filter).length;
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  openAssign(lesson: Leccion): void {
    this.assignTarget.set({ id: lesson._id, titulo: lesson.titulo });
  }

  deleteLesson(lesson: Leccion): void {
    if (!confirm(`¿Eliminar "${lesson.titulo}"? Esta acción no se puede deshacer.`)) return;
    this.lessonService.deleteLeccion(lesson._id)
      .pipe(catchError(() => of(null)))
      .subscribe((result) => {
        if (result !== null) {
          this.deletedIds.update((ids) => new Set([...ids, lesson._id]));
        }
      });
  }

  formatDate(iso?: string): string {
    return formatShortDate(iso);
  }

  nivelColor(nivel: string): string {
    return LESSON_LEVEL_COLOR[nivel] ?? '#94A3B8';
  }

  statusBadgeClass(status: EstadoLeccion): string {
    return LESSON_STATUS_BADGE_CLASS[status];
  }

  estadoLabel(status: EstadoLeccion): string {
    return LESSON_STATUS_LABEL[status];
  }
}
