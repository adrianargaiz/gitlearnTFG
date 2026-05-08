import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { LESSON_LEVEL_COLOR, LESSON_LEVEL_ORDER } from '../../../core/constants/learning.constants';
import { InsigniaService } from '../../../core/services/insignia.service';
import { LessonService } from '../../../core/services/lesson.service';
import { ProgresoService } from '../../../core/services/progreso.service';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TopbarComponent],
  template: `
    <div class="min-h-screen" style="background:var(--bg)">
      <app-topbar />

      <main class="gl-main" style="max-width:880px;margin:0 auto">
        <!-- Welcome -->
        <div style="margin-bottom:32px">
          <h1 class="gl-page-title">Hola, {{ firstName() }}</h1>
          <p style="color:var(--muted);margin-top:4px">
            {{ (user()?.racha ?? 0) > 0 ? 'Llevas ' + user()!.racha + ' días seguidos. ¡Sigue así!' : 'Comienza hoy tu racha.' }}
          </p>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" style="margin-bottom:24px">
          <div class="gl-stat-card" style="border-color:var(--gold-border);background:var(--gold-bg)">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span style="font-size:12px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:0.05em">XP Total</span>
            </div>
            <div class="gl-stat-value" style="color:var(--gold)">{{ user()?.xpTotal ?? 0 }}</div>
            <div class="gl-stat-label">puntos de experiencia</div>
          </div>

          <div class="gl-stat-card" style="border-color:var(--orange-border);background:var(--orange-bg)">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              <span style="font-size:12px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:0.05em">Racha</span>
            </div>
            <div class="gl-stat-value" style="color:var(--orange)">{{ user()?.racha ?? 0 }}</div>
            <div class="gl-stat-label">días consecutivos</div>
          </div>

          <div class="gl-stat-card">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              <span style="font-size:12px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:0.05em">Lecciones</span>
            </div>
            <div class="gl-stat-value">
              {{ completedCount() }}<span style="font-size:18px;color:var(--muted)">/{{ lecciones().length }}</span>
            </div>
            <div class="gl-stat-label">completadas</div>
          </div>

          <div class="gl-stat-card">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span style="font-size:12px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:0.05em">Insignias</span>
            </div>
            <div class="gl-stat-value">{{ insigniasGanadas().length }}</div>
            <div class="gl-stat-label">desbloqueadas</div>
          </div>
        </div>

        <!-- 2-column grid -->
        <div style="display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start">

          <!-- Left column -->
          <div style="display:flex;flex-direction:column;gap:20px">

            <!-- Progress card -->
            <div class="gl-card">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <div>
                  <div style="font-size:16px;font-weight:800;color:var(--text)">Tu progreso</div>
                  <div style="font-size:13px;color:var(--muted);margin-top:2px">{{ levelLabel() }} · Nivel {{ levelNum() }}</div>
                </div>
                <div style="font-size:28px;font-weight:900;color:var(--green)">{{ progressPct() }}%</div>
              </div>
              <div class="gl-progress-track">
                <div class="gl-progress-fill" [style.width.%]="progressPct()"></div>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:var(--muted)">
                <span>{{ completedCount() }} completadas</span>
                <span>{{ lecciones().length - completedCount() }} restantes</span>
              </div>
              <hr class="gl-divider" style="margin:16px 0">
              <!-- XP to next level -->
              <div style="font-size:13px;color:var(--text2);margin-bottom:8px;display:flex;justify-content:space-between">
                <span>XP hasta nivel {{ levelNum() + 1 }}</span>
                <span style="color:var(--gold);font-weight:700">{{ xpInLevel() }} / 100</span>
              </div>
              <div class="gl-progress-track" style="height:8px">
                <div style="height:100%;background:var(--gold);border-radius:var(--r-full);transition:width 0.4s ease"
                     [style.width.%]="xpInLevel()"></div>
              </div>
            </div>

            <!-- Next lesson CTA -->
            @if (currentLesson(); as cur) {
              <div style="background:var(--green-bg);border:1.5px solid var(--green-border);border-radius:var(--r-xl);padding:20px 24px;display:flex;align-items:center;gap:16px">
                <div style="width:48px;height:48px;border-radius:50%;background:var(--green);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#0a1a00" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:12px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Continuar aprendiendo</div>
                  <div style="font-size:16px;font-weight:700;color:var(--text)">{{ cur.titulo }}</div>
                  <div style="font-size:13px;color:var(--text2);margin-top:2px;display:flex;align-items:center;gap:8px">
                    <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:var(--r-full);border:1px solid"
                          [style.color]="nivelColor(cur.nivel)"
                          [style.border-color]="nivelColor(cur.nivel) + '50'"
                          [style.background]="nivelColor(cur.nivel) + '18'">{{ cur.nivel }}</span>
                    <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--gold);background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:var(--r-full);padding:2px 8px">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      {{ cur.xpRecompensa }} XP
                    </span>
                  </div>
                </div>
                <a [routerLink]="['/app/lecciones', cur._id]" class="gl-btn gl-btn-md gl-btn-primary" style="flex-shrink:0">
                  Continuar
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0a1a00" stroke-width="2.5" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                </a>
              </div>
            } @else {
              <div style="background:var(--green-bg);border:1.5px solid var(--green-border);border-radius:var(--r-xl);padding:24px;text-align:center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="1.5" style="display:block;margin:0 auto 10px" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
                <div style="font-size:18px;font-weight:800;color:var(--green)">¡Completaste todo!</div>
                <div style="font-size:14px;color:var(--text2);margin-top:4px">Has terminado todas las lecciones disponibles.</div>
              </div>
            }
          </div>

          <!-- Right column — Badges -->
          <div class="gl-card">
            <div style="font-size:15px;font-weight:800;color:var(--text);margin-bottom:16px">Logros recientes</div>
            @if (earnedBadgesPreview().length === 0) {
              <div style="text-align:center;padding:24px 0">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" style="display:block;margin:0 auto 8px" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <div style="font-size:13px;font-weight:700;color:var(--text2)">Sin insignias aún</div>
                <div style="font-size:12px;color:var(--muted);margin-top:2px">Completa lecciones para ganarlas</div>
              </div>
            } @else {
              <div style="display:flex;flex-direction:column;gap:12px">
                @for (ins of earnedBadgesPreview(); track ins._id) {
                  <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface2);border-radius:var(--r-lg);border:1px solid var(--gold-border)">
                    <div style="width:40px;height:40px;border-radius:50%;background:var(--gold-bg);border:1.5px solid var(--gold-border);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div style="min-width:0">
                      <div style="font-size:13px;font-weight:700;color:var(--text)">{{ ins.nombre }}</div>
                      <div style="font-size:12px;color:var(--muted);margin-top:2px">{{ ins.descripcion }}</div>
                    </div>
                  </div>
                }
              </div>
            }
            <a routerLink="/app/progreso" class="gl-btn gl-btn-sm gl-btn-ghost w-full" style="margin-top:16px;justify-content:center">
              Ver todos los logros
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
            </a>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);
  private readonly lessonService = inject(LessonService);
  private readonly progresoService = inject(ProgresoService);
  private readonly insigniaService = inject(InsigniaService);

  constructor() {
    this.progresoService.loadMiProgreso().subscribe();
  }

  readonly user = this.authService.currentUser;

  readonly firstName = computed(() => {
    const name = this.user()?.nombre ?? '';
    return name.split(' ')[0] || 'estudiante';
  });

  private readonly _loaded = signal(false);

  readonly lecciones = toSignal(
    this.lessonService.getLecciones().pipe(
      tap(() => this._loaded.set(true)),
      catchError(() => { this._loaded.set(true); return of([]); }),
    ),
    { initialValue: [] },
  );

  readonly progreso = this.progresoService.misProgreso;

  readonly insigniasAll = toSignal(
    this.insigniaService.getInsignias().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  readonly insigniasGanadas = toSignal(
    this.insigniaService.getMisInsignias().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  readonly loading = computed(() => !this._loaded());

  readonly completedIds = computed(
    () => new Set(this.progreso().filter((p) => p.completada).map((p) => p.leccionId)),
  );

  readonly completedCount = computed(() => this.completedIds().size);

  readonly progressPct = computed(() => {
    const total = this.lecciones().length;
    return total > 0 ? Math.round((this.completedCount() / total) * 100) : 0;
  });

  readonly levelNum = computed(() => Math.floor((this.user()?.xpTotal ?? 0) / 100) + 1);

  readonly xpInLevel = computed(() => (this.user()?.xpTotal ?? 0) % 100);

  readonly levelLabel = computed(() => {
    const pct = this.progressPct();
    if (pct < 25) return 'Principiante';
    if (pct < 50) return 'Aprendiz';
    if (pct < 75) return 'Practicante';
    return 'Experto';
  });

  readonly currentLesson = computed(() => {
    const completed = this.completedIds();
    return [...this.lecciones()]
      .sort((a, b) => {
        const nd = LESSON_LEVEL_ORDER.indexOf(a.nivel) - LESSON_LEVEL_ORDER.indexOf(b.nivel);
        return nd !== 0 ? nd : a.orden - b.orden;
      })
      .find((l) => !completed.has(l._id)) ?? null;
  });

  readonly earnedBadgesPreview = computed(() => {
    const earnedIds = new Set(this.insigniasGanadas().map((i) => i._id));
    return this.insigniasAll()
      .filter((i) => earnedIds.has(i._id))
      .slice(0, 3);
  });

  nivelColor(nivel: string): string {
    return LESSON_LEVEL_COLOR[nivel] ?? '#94A3B8';
  }
}
