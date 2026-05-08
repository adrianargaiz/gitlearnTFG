import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import {
  LESSON_LEVEL_COLOR,
  LESSON_STATUS_BADGE_CLASS,
  LESSON_STATUS_LABEL,
} from '../../../core/constants/learning.constants';
import { AdminLeccion, AdminService } from '../../../core/services/admin.service';
import { EstadoLeccion } from '../../../core/services/lesson.service';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { formatShortDate } from '../../../shared/utils/format-date';
import { getInitials } from '../../../shared/utils/initials';

type StatusFilter = 'todas' | EstadoLeccion;

@Component({
  selector: 'app-content-moderation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TopbarComponent],
  template: `
    <div class="min-h-screen" style="background:var(--bg)">
      <app-topbar />

      <main class="gl-main" style="max-width:1100px;margin:0 auto">
        <header style="margin-bottom:28px">
          <h1 class="gl-page-title">Moderación de contenido</h1>
          <p class="gl-page-subtitle">Gestiona el estado de todas las lecciones</p>
        </header>

        <!-- Filters row -->
        <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
          <div class="gl-tabs" role="tablist" aria-label="Filtrar por estado">
            @for (f of statusFilters; track f.value) {
              <button type="button" role="tab"
                [attr.aria-selected]="statusFilter() === f.value"
                (click)="statusFilter.set(f.value)"
                class="gl-tab" [class.active]="statusFilter() === f.value">
                {{ f.label }}
                <span style="margin-left:5px;font-size:11px;background:var(--surface3);border-radius:var(--r-full);padding:1px 7px;color:var(--muted)">{{ countByStatus(f.value) }}</span>
              </button>
            }
          </div>
          <div style="position:relative;flex:1;max-width:300px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <label for="search" class="sr-only">Buscar lección</label>
            <input id="search" type="search" [value]="query()" (input)="onQuery($event)"
              placeholder="Buscar por título o autor..."
              class="gl-input" style="padding-left:36px;height:40px;font-size:14px"/>
          </div>
        </div>

        <!-- Table -->
        <div class="gl-card" style="padding:0;overflow:hidden">
          <div class="overflow-x-auto">
            <table class="gl-table">
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Autor</th>
                  <th scope="col">Nivel</th>
                  <th scope="col">Ejercicios</th>
                  <th scope="col">Actualizada</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Cambiar estado</th>
                </tr>
              </thead>
              <tbody>
                @for (l of filtered(); track l._id) {
                  <tr>
                    <td>
                      <div style="font-weight:700;color:var(--text);font-size:14px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ l.titulo }}</div>
                      @if (l.descripcion) {
                        <div style="font-size:12px;color:var(--muted);margin-top:2px">{{ l.descripcion.length > 55 ? l.descripcion.slice(0,55) + '…' : l.descripcion }}</div>
                      }
                    </td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div style="width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;background:var(--violet-bg);border:1.5px solid var(--violet-border);color:var(--violet)"
                             aria-hidden="true">
                          {{ authorInitials(l.autorId) }}
                        </div>
                        <span style="font-size:13px;color:var(--text2);font-weight:600">{{ authorName(l.autorId) || '—' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="gl-badge"
                            [style.color]="nivelColor(l.nivel)"
                            [style.borderColor]="nivelColor(l.nivel) + '40'"
                            [style.background]="nivelColor(l.nivel) + '18'">
                        {{ l.nivel }}
                      </span>
                    </td>
                    <td style="font-size:13px;color:var(--text2)">{{ l.ejerciciosCount ?? '—' }}</td>
                    <td style="font-size:12px;color:var(--muted)">{{ formatDate(l.updatedAt) }}</td>
                    <td>
                      <span class="gl-badge" [class]="statusBadgeClass(l.estado)">{{ estadoLabel(l.estado) }}</span>
                    </td>
                    <td>
                      <label class="sr-only" [attr.for]="'estado-' + l._id">Cambiar estado de {{ l.titulo }}</label>
                      <select [id]="'estado-' + l._id" [value]="l.estado"
                        (change)="onStatusChange(l._id, $event)"
                        class="gl-select" style="width:auto;padding:5px 28px 5px 10px;font-size:13px;height:34px">
                        <option value="borrador">Borrador</option>
                        <option value="publicada">Publicada</option>
                        <option value="archivada">Archivada</option>
                      </select>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" style="text-align:center;padding:64px 16px">
                      <div style="display:flex;flex-direction:column;align-items:center;color:var(--muted)">
                        <div style="width:56px;height:56px;border-radius:var(--r-xl);background:var(--surface2);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;margin-bottom:16px">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                        </div>
                        <p style="font-size:14px;font-weight:600;color:var(--text2)">Sin lecciones</p>
                        <p style="font-size:12px;margin-top:4px">No se encontraron lecciones con los filtros actuales.</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  `,
})
export class ContentModerationComponent {
  private readonly adminService = inject(AdminService);

  readonly query = signal('');
  readonly statusFilter = signal<StatusFilter>('todas');

  readonly statusFilters: readonly { value: StatusFilter; label: string }[] = [
    { value: 'todas',     label: 'Todas' },
    { value: 'publicada', label: 'Publicadas' },
    { value: 'borrador',  label: 'Borradores' },
    { value: 'archivada', label: 'Archivadas' },
  ];

  private readonly serverLessons = toSignal(
    this.adminService.getLecciones().pipe(catchError(() => of([]))),
    { initialValue: [] as AdminLeccion[] },
  );

  readonly localLessons = signal<AdminLeccion[]>([]);

  constructor() {
    effect(() => {
      const srv = this.serverLessons();
      if (srv.length > 0 && this.localLessons().length === 0) {
        this.localLessons.set([...srv]);
      }
    });
  }

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const s = this.statusFilter();
    const src = this.localLessons().length ? this.localLessons() : this.serverLessons();
    return src.filter((l) => {
      const matchStatus = s === 'todas' || l.estado === s;
      const matchQuery  = !q || l.titulo.toLowerCase().includes(q) || this.authorName(l.autorId).toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  });

  countByStatus(filter: StatusFilter): number {
    const src = this.localLessons().length ? this.localLessons() : this.serverLessons();
    if (filter === 'todas') return src.length;
    return src.filter((l) => l.estado === filter).length;
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  onStatusChange(id: string, event: Event): void {
    const estado = (event.target as HTMLSelectElement).value as EstadoLeccion;
    this.localLessons.update((list) => list.map((l) => (l._id === id ? { ...l, estado } : l)));
    this.adminService.updateLeccionEstado(id, estado).pipe(catchError(() => of(null))).subscribe();
  }

  authorName(autorId: string | { _id: string; nombre: string }): string {
    return typeof autorId === 'object' ? autorId.nombre : '';
  }

  authorInitials(autorId: string | { _id: string; nombre: string }): string {
    return getInitials(this.authorName(autorId));
  }

  formatDate(iso?: string): string {
    return formatShortDate(iso);
  }

  nivelColor(nivel: string): string {
    return LESSON_LEVEL_COLOR[nivel] ?? '#94A3B8';
  }

  statusBadgeClass(estado: EstadoLeccion): string {
    return LESSON_STATUS_BADGE_CLASS[estado];
  }

  estadoLabel(estado: EstadoLeccion): string {
    return LESSON_STATUS_LABEL[estado] ?? estado;
  }
}
