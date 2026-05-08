import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import {
  LESSON_LEVEL_COLOR,
  LESSON_STATUS_BADGE_CLASS,
  LESSON_STATUS_LABEL,
} from '../../../core/constants/learning.constants';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { formatShortDate } from '../../../shared/utils/format-date';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TopbarComponent],
  template: `
    <div class="min-h-screen" style="background:var(--bg)">
      <app-topbar />

      <main class="gl-main" style="max-width:1000px;margin:0 auto">
        <header class="mb-8">
          <h1 class="gl-page-title">Panel de administración</h1>
          <p class="gl-page-subtitle">Visión general del sistema GitLearn</p>
        </header>

        <!-- Stats row -->
        <section class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8" aria-label="Estadísticas globales">
          <div class="gl-stat-card" style="border-color:var(--blue-border);background:var(--blue-bg)">
            <div class="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <p class="gl-label" style="color:var(--blue);margin-bottom:0">Usuarios</p>
            </div>
            <p class="gl-stat-value" style="color:var(--blue)">{{ stats().usuarios }}</p>
          </div>
          <div class="gl-stat-card" style="border-color:var(--green-border);background:var(--green-bg)">
            <div class="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              <p class="gl-label" style="color:var(--green);margin-bottom:0">Publicadas</p>
            </div>
            <p class="gl-stat-value" style="color:var(--green)">{{ stats().leccionesPublicadas }}</p>
          </div>
          <div class="gl-stat-card" style="border-color:var(--amber-border);background:var(--amber-bg)">
            <div class="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <p class="gl-label" style="color:var(--amber);margin-bottom:0">Borradores</p>
            </div>
            <p class="gl-stat-value" style="color:var(--amber)">{{ stats().borradores }}</p>
          </div>
          <div class="gl-stat-card" style="border-color:var(--grey-border);background:var(--grey-bg)">
            <div class="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--grey)" stroke-width="2" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              <p class="gl-label" style="color:var(--grey);margin-bottom:0">Archivadas</p>
            </div>
            <p class="gl-stat-value" style="color:var(--grey)">{{ stats().archivadas }}</p>
          </div>
          <div class="gl-stat-card" style="border-color:var(--gold-border);background:var(--gold-bg)">
            <div class="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <p class="gl-label" style="color:var(--gold);margin-bottom:0">Ejercicios</p>
            </div>
            <p class="gl-stat-value" style="color:var(--gold)">{{ stats().ejercicios }}</p>
          </div>
        </section>

        <div class="grid gap-5 grid-cols-1 lg:grid-cols-[1fr_320px]">
          <!-- Left: recent lessons + quick nav -->
          <div class="flex flex-col gap-4">
            <!-- Recent lessons -->
            <div class="gl-card">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-base font-bold" style="color:var(--text)">Lecciones recientes</h2>
                <a routerLink="/admin/contenido" class="text-xs font-semibold transition-colors" style="color:var(--green)">Ver todo →</a>
              </div>
              @for (l of recentLessons(); track l._id; let last = $last) {
                <div [style.border-bottom]="last ? 'none' : '1px solid var(--border-subtle)'">
                  <div class="flex items-center gap-3 py-3">
                    <div class="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                         style="background:var(--surface2);border:1.5px solid var(--border);color:var(--muted)">
                      {{ l.orden }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold truncate" style="color:var(--text)">{{ l.titulo }}</p>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-xs" style="color:var(--muted)">{{ authorName(l.autorId) }}</span>
                        <span class="gl-badge" [style.color]="nivelColor(l.nivel)"
                              [style.borderColor]="nivelColor(l.nivel) + '40'"
                              [style.background]="nivelColor(l.nivel) + '18'">{{ l.nivel }}</span>
                      </div>
                    </div>
                    <span class="gl-badge flex-shrink-0" [class]="statusBadgeClass(l.estado)">{{ estadoLabel(l.estado) }}</span>
                  </div>
                </div>
              } @empty {
                <p class="text-sm text-center py-6" style="color:var(--muted)">Cargando lecciones…</p>
              }
            </div>

            <!-- Quick nav -->
            <div class="grid grid-cols-2 gap-4">
              <a routerLink="/admin/usuarios" class="gl-card flex flex-col gap-3 cursor-pointer transition-colors"
                 style="text-decoration:none" onmouseenter="this.style.borderColor='rgba(59,130,246,0.5)'" onmouseleave="this.style.borderColor='var(--border)'">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                     style="background:var(--blue-bg);border:1.5px solid var(--blue-border)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <p class="text-sm font-bold" style="color:var(--text)">Gestionar usuarios</p>
                  <p class="text-xs mt-1" style="color:var(--muted)">{{ stats().usuarios }} registrados</p>
                </div>
              </a>
              <a routerLink="/admin/contenido" class="gl-card flex flex-col gap-3 cursor-pointer transition-colors"
                 style="text-decoration:none" onmouseenter="this.style.borderColor='rgba(124,58,237,0.5)'" onmouseleave="this.style.borderColor='var(--border)'">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                     style="background:var(--violet-bg);border:1.5px solid var(--violet-border)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" stroke-width="2" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                </div>
                <div>
                  <p class="text-sm font-bold" style="color:var(--text)">Moderar contenido</p>
                  <p class="text-xs mt-1" style="color:var(--muted)">{{ stats().leccionesPublicadas + stats().borradores + stats().archivadas }} lecciones</p>
                </div>
              </a>
            </div>
          </div>

          <!-- Right: role chart + system status -->
          <div class="flex flex-col gap-4">
            <!-- Role distribution -->
            <div class="gl-card">
              <h3 class="text-sm font-bold mb-5" style="color:var(--text)">Distribución de roles</h3>
              <div class="flex flex-col gap-4">
                @for (r of roleBreakdown(); track r.rol) {
                  <div>
                    <div class="flex justify-between text-sm mb-1.5">
                      <span class="font-semibold capitalize" style="color:var(--text2)">{{ r.label }}</span>
                      <span class="font-bold" [style.color]="r.color">{{ r.count }}</span>
                    </div>
                    <div class="gl-progress-track">
                      <div class="gl-progress-fill"
                           [style.width.%]="r.pct"
                           [style.background]="r.color"></div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- System status -->
            <div class="gl-card" style="border-color:var(--green-border);background:var(--green-bg)">
              <p class="gl-label mb-4" style="color:var(--green)">Estado del sistema</p>
              <div class="flex flex-col gap-3">
                <div class="flex justify-between text-sm">
                  <span style="color:var(--text2)">Usuarios activos</span>
                  <span class="font-bold" style="color:var(--green)">{{ activeUsers() }}/{{ stats().usuarios }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span style="color:var(--text2)">Tasa publicación</span>
                  <span class="font-bold" style="color:var(--green)">{{ publishRate() }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class AdminDashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly adminService = inject(AdminService);

  readonly firstName = computed(() => {
    const name = this.authService.currentUser()?.nombre ?? '';
    return name.split(' ')[0] || 'admin';
  });

  private readonly usuarios = toSignal(
    this.adminService.getUsuarios().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly lecciones = toSignal(
    this.adminService.getLecciones().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  readonly stats = computed(() => {
    const u = this.usuarios();
    const l = this.lecciones();
    return {
      usuarios: u.length,
      leccionesPublicadas: l.filter((x) => x.estado === 'publicada').length,
      borradores: l.filter((x) => x.estado === 'borrador').length,
      archivadas: l.filter((x) => x.estado === 'archivada').length,
      ejercicios: l.reduce((acc, x) => acc + (x.ejerciciosCount ?? 0), 0),
    };
  });

  readonly roleBreakdown = computed(() => {
    const u = this.usuarios();
    const rows = [
      { rol: 'estudiante', label: 'Estudiantes', color: 'var(--blue)', count: u.filter((x) => x.rol === 'estudiante').length },
      { rol: 'profesor', label: 'Profesores', color: 'var(--violet)', count: u.filter((x) => x.rol === 'profesor').length },
      { rol: 'administrador', label: 'Administradores', color: 'var(--orange)', count: u.filter((x) => x.rol === 'administrador').length },
    ];
    const max = Math.max(...rows.map((r) => r.count), 1);
    return rows.map((r) => ({ ...r, pct: Math.round((r.count / max) * 100) }));
  });

  readonly activeUsers = computed(() => this.usuarios().filter((u) => u.activo).length);

  readonly publishRate = computed(() => {
    const l = this.lecciones();
    return l.length ? Math.round((l.filter((x) => x.estado === 'publicada').length / l.length) * 100) : 0;
  });

  readonly recentLessons = computed(() =>
    [...this.lecciones()]
      .sort((a, b) => (a.updatedAt && b.updatedAt ? b.updatedAt.localeCompare(a.updatedAt) : 0))
      .slice(0, 5),
  );

  authorName(autorId: string | { _id: string; nombre: string }): string {
    return typeof autorId === 'object' ? autorId.nombre : '';
  }

  formatDate(iso?: string): string {
    return formatShortDate(iso);
  }

  nivelColor(nivel: string): string {
    return LESSON_LEVEL_COLOR[nivel] ?? '#94A3B8';
  }

  statusBadgeClass(estado: string): string {
    return LESSON_STATUS_BADGE_CLASS[estado as keyof typeof LESSON_STATUS_BADGE_CLASS] ?? 'gl-badge-grey';
  }

  estadoLabel(estado: string): string {
    return LESSON_STATUS_LABEL[estado as keyof typeof LESSON_STATUS_LABEL] ?? estado;
  }
}
