import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import {
  LESSON_LEVEL_COLOR,
  LESSON_STATUS_BADGE_CLASS,
} from '../../../core/constants/learning.constants';
import { AuthService } from '../../../core/services/auth.service';
import { EstadoLeccion, LessonService } from '../../../core/services/lesson.service';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { formatShortDate } from '../../../shared/utils/format-date';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TopbarComponent],
  template: `
    <div class="min-h-screen" style="background:var(--bg)">
      <app-topbar />

      <main class="gl-main" style="max-width:900px;margin:0 auto">
        <header class="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 class="gl-page-title">Hola, {{ firstName() }}</h1>
            <p class="gl-page-subtitle">Panel de gestión de contenido</p>
          </div>
          <a routerLink="/profesor/lecciones/nueva" class="gl-btn gl-btn-md gl-btn-primary flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva lección
          </a>
        </header>

        <!-- Stats -->
        <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" aria-label="Estadísticas de enseñanza">
          <div class="gl-stat-card" style="border-color:var(--blue-border);background:var(--blue-bg)">
            <div class="flex items-center gap-2 mb-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <p class="gl-label" style="color:var(--blue);margin-bottom:0">Lecciones</p>
            </div>
            <p class="gl-stat-value" style="color:var(--blue)">{{ stats().total }}</p>
          </div>
          <div class="gl-stat-card" style="border-color:var(--green-border);background:var(--green-bg)">
            <div class="flex items-center gap-2 mb-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              <p class="gl-label" style="color:var(--green);margin-bottom:0">Publicadas</p>
            </div>
            <p class="gl-stat-value" style="color:var(--green)">{{ stats().published }}</p>
          </div>
          <div class="gl-stat-card" style="border-color:var(--amber-border);background:var(--amber-bg)">
            <div class="flex items-center gap-2 mb-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <p class="gl-label" style="color:var(--amber);margin-bottom:0">Borradores</p>
            </div>
            <p class="gl-stat-value" style="color:var(--amber)">{{ stats().drafts }}</p>
          </div>
          <div class="gl-stat-card" style="border-color:var(--gold-border);background:var(--gold-bg)">
            <div class="flex items-center gap-2 mb-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <p class="gl-label" style="color:var(--gold);margin-bottom:0">Ejercicios</p>
            </div>
            <p class="gl-stat-value" style="color:var(--gold)">{{ stats().exercises }}</p>
          </div>
        </section>

        <div class="grid gap-5 grid-cols-1 lg:grid-cols-[1fr_280px]">
          <!-- Recent lessons -->
          <section class="gl-card">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-base font-bold" style="color:var(--text)">Mis lecciones recientes</h2>
              <a routerLink="/profesor/lecciones" class="text-xs font-semibold transition-colors" style="color:var(--green)">Ver todas →</a>
            </div>

            @if (recent().length === 0 && !loading()) {
              <div class="flex flex-col items-center py-10" style="color:var(--muted)">
                <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                     style="background:var(--surface2);border:1.5px solid var(--border)">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                </div>
                <p class="text-sm font-semibold mb-1" style="color:var(--text2)">Sin lecciones aún</p>
                <p class="text-xs">Crea tu primera lección para empezar</p>
              </div>
            } @else if (loading()) {
              <p class="text-sm text-center py-8" style="color:var(--muted)">Cargando…</p>
            } @else {
              <div>
                @for (lesson of recent(); track lesson._id; let last = $last) {
                  <div [style.border-bottom]="last ? 'none' : '1px solid var(--border-subtle)'">
                    <a [routerLink]="['/profesor/lecciones', lesson._id]"
                       class="flex items-center gap-3 py-3.5 hover:opacity-75 transition-opacity" style="text-decoration:none">
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                           style="background:var(--surface2);border:1.5px solid var(--border);color:var(--muted)">
                        {{ lesson.orden }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold truncate" style="color:var(--text)">{{ lesson.titulo }}</p>
                        <div class="flex items-center gap-2 mt-1 flex-wrap">
                          <span class="gl-badge"
                                [style.color]="nivelColor(lesson.nivel)"
                                [style.borderColor]="nivelColor(lesson.nivel) + '40'"
                                [style.background]="nivelColor(lesson.nivel) + '18'">{{ lesson.nivel }}</span>
                          <span class="gl-badge" [class]="estadoBadgeClass(lesson.estado)">{{ lesson.estado }}</span>
                          <span class="text-[11px]" style="color:var(--muted)">{{ lesson.ejerciciosCount ?? 0 }} ej.</span>
                        </div>
                      </div>
                      <span class="gl-badge gl-badge-gold flex-shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        {{ lesson.xpRecompensa }}
                      </span>
                    </a>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Sidebar -->
          <div class="flex flex-col gap-4">
            <div class="gl-card">
              <h3 class="text-sm font-bold mb-4" style="color:var(--text)">Acciones rápidas</h3>
              <div class="flex flex-col gap-2">
                <a routerLink="/profesor/lecciones/nueva" class="gl-btn gl-btn-md gl-btn-primary w-full">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Crear lección
                </a>
                <a routerLink="/profesor/lecciones" class="gl-btn gl-btn-md gl-btn-secondary w-full">
                  Gestionar lecciones
                </a>
              </div>
            </div>
            <div class="gl-card" style="border-color:var(--green-border);background:var(--green-bg)">
              <p class="gl-label mb-2" style="color:var(--green)">Consejo</p>
              <p class="text-sm leading-relaxed" style="color:var(--text2)">Añade ejercicios variados para mejorar la retención. Combina opción múltiple con relleno de huecos.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class TeacherDashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly lessonService = inject(LessonService);

  readonly firstName = computed(() => {
    const name = this.authService.currentUser()?.nombre ?? '';
    return name.split(' ')[0] || 'profesor';
  });

  private readonly _loaded = signal(false);

  private readonly misLecciones = toSignal(
    this.lessonService.getMisLecciones().pipe(
      tap(() => this._loaded.set(true)),
      catchError(() => { this._loaded.set(true); return of([]); }),
    ),
    { initialValue: [] },
  );

  readonly loading = computed(() => !this._loaded());

  readonly stats = computed(() => {
    const all = this.misLecciones();
    return {
      total: all.length,
      published: all.filter((l) => l.estado === 'publicada').length,
      drafts: all.filter((l) => l.estado === 'borrador').length,
      exercises: all.reduce((acc, l) => acc + (l.ejerciciosCount ?? 0), 0),
    };
  });

  readonly recent = computed(() =>
    [...this.misLecciones()]
      .sort((a, b) => (a.updatedAt && b.updatedAt ? b.updatedAt.localeCompare(a.updatedAt) : 0))
      .slice(0, 5),
  );

  nivelColor(nivel: string): string {
    return LESSON_LEVEL_COLOR[nivel] ?? '#94A3B8';
  }

  estadoBadgeClass(status: EstadoLeccion): string {
    return LESSON_STATUS_BADGE_CLASS[status];
  }

  formatDate(iso?: string): string {
    return formatShortDate(iso);
  }
}
