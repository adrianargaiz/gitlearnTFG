import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { LESSON_LEVEL_COLOR, badgeColor, badgeIconPath } from '../../core/constants/learning.constants';
import { AuthService } from '../../core/services/auth.service';
import { InsigniaService } from '../../core/services/insignia.service';
import { LessonService } from '../../core/services/lesson.service';
import { ProgresoService } from '../../core/services/progreso.service';
import { TopbarComponent } from '../../shared/topbar/topbar.component';
import { formatShortDate } from '../../shared/utils/format-date';

@Component({
  selector: 'app-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TopbarComponent],
  template: `
    <div class="min-h-screen" style="background:var(--bg)">
      <app-topbar />

      <main class="gl-main" style="max-width:800px;margin:0 auto">
        <div style="margin-bottom:32px">
          <h1 class="gl-page-title">Tu progreso</h1>
          <p class="gl-page-subtitle">Un resumen de tu camino en GitLearn</p>
        </div>

        <!-- XP + Streak hero -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4" style="margin-bottom:24px">
          <div class="gl-card" style="background:var(--gold-bg);border-color:var(--gold-border)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              <span style="font-size:13px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:0.05em">Experiencia total</span>
            </div>
            <div style="font-size:40px;font-weight:900;color:var(--gold);line-height:1;margin-bottom:12px">
              {{ user()?.xpTotal ?? 0 }} <span style="font-size:18px;color:var(--gold)">XP</span>
            </div>
            <div style="font-size:13px;color:var(--text2);margin-bottom:10px">
              Nivel {{ levelNum() }} · {{ xpInLevel() }}/100 XP para nivel {{ levelNum() + 1 }}
            </div>
            <div class="gl-progress-track" style="height:8px">
              <div style="height:100%;background:var(--gold);border-radius:var(--r-full);transition:width 0.4s ease"
                   [style.width.%]="xpInLevel()"></div>
            </div>
          </div>

          <div class="gl-card" style="background:var(--orange-bg);border-color:var(--orange-border)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              <span style="font-size:13px;font-weight:700;color:var(--orange);text-transform:uppercase;letter-spacing:0.05em">Racha actual</span>
            </div>
            <div style="font-size:40px;font-weight:900;color:var(--orange);line-height:1;margin-bottom:8px">{{ user()?.racha ?? 0 }}</div>
            <div style="font-size:13px;color:var(--text2)">días consecutivos de práctica</div>
            <div style="margin-top:16px;display:flex;gap:6px">
              @for (dot of streakDots(); track $index) {
                <div style="flex:1;height:6px;border-radius:3px;transition:background 0.3s"
                     [style.background]="dot ? 'var(--orange)' : 'var(--surface3)'"></div>
              }
            </div>
          </div>
        </div>

        <!-- Completed lessons -->
        <div class="gl-card" style="margin-bottom:24px">
          <div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:16px">Historial de lecciones</div>
          @if (completedHistory().length === 0) {
            <div style="text-align:center;padding:32px 0">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.5" style="display:block;margin:0 auto 8px" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
              <div style="font-size:13px;font-weight:700;color:var(--text2)">Sin lecciones completadas</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">Completa tu primera lección para verla aquí</div>
            </div>
          } @else {
            <div style="display:flex;flex-direction:column;gap:0">
              @for (entry of completedHistory(); track entry.leccionId; let last = $last) {
                <div>
                  <div style="display:flex;align-items:center;gap:12px;padding:14px 0">
                    <div style="width:40px;height:40px;border-radius:50%;background:var(--green-bg);border:1.5px solid var(--green-border);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div style="flex:1;min-width:0">
                      <div style="font-size:14px;font-weight:700;color:var(--text)">{{ entry.titulo }}</div>
                      <div style="font-size:12px;color:var(--muted);margin-top:2px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                        <span style="font-size:11px;font-weight:700;padding:1px 7px;border-radius:var(--r-full);border:1px solid"
                              [style.color]="nivelColor(entry.nivel)"
                              [style.border-color]="nivelColor(entry.nivel) + '50'"
                              [style.background]="nivelColor(entry.nivel) + '18'">{{ entry.nivel }}</span>
                        @if (entry.fecha) { <span>{{ entry.fecha }}</span> }
                        <span>{{ entry.intentos }} intento{{ entry.intentos !== 1 ? 's' : '' }}</span>
                      </div>
                    </div>
                    <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--gold);background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:var(--r-full);padding:3px 10px;flex-shrink:0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      {{ entry.xpObtenido }} XP
                    </span>
                  </div>
                  @if (!last) { <hr class="gl-divider"> }
                </div>
              }
            </div>
          }
        </div>

        <!-- Badges grid -->
        <div class="gl-card">
          <div style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:6px">Insignias</div>
          <p style="font-size:13px;color:var(--muted);margin-bottom:20px">{{ insigniasGanadas().length }} de {{ insigniasAll().length }} desbloqueadas</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            @for (badge of badgeList(); track badge._id) {
              <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:16px 12px;border-radius:var(--r-lg);border:1.5px solid;transition:all 0.2s"
                   [style.border-color]="badge.earned ? (badge.color + '60') : 'var(--border)'"
                   [style.background]="badge.earned ? (badge.color + '14') : 'var(--surface2)'"
                   [style.opacity]="badge.earned ? '1' : '0.5'">
                <div style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:10px;border:1.5px solid"
                     [style.background]="badge.earned ? (badge.color + '26') : 'var(--surface3)'"
                     [style.border-color]="badge.earned ? (badge.color + '60') : 'var(--border)'">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
                       [attr.stroke]="badge.earned ? badge.color : 'var(--muted)'">
                    <path [attr.d]="badge.iconPath"/>
                  </svg>
                </div>
                <p style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:4px">{{ badge.nombre }}</p>
                <p style="font-size:11px;color:var(--muted);line-height:1.4">{{ badge.descripcion }}</p>
                @if (badge.earned) {
                  <p style="font-size:11px;font-weight:700;margin-top:8px" [style.color]="badge.color">Obtenida</p>
                } @else {
                  <p style="font-size:11px;color:var(--muted);margin-top:8px">Bloqueada</p>
                }
              </div>
            } @empty {
              <p class="col-span-4" style="text-align:center;padding:32px;font-size:14px;color:var(--muted)">Cargando insignias…</p>
            }
          </div>
        </div>
      </main>
    </div>
  `,
})
export class ProgressComponent {
  private readonly authService = inject(AuthService);
  private readonly lessonService = inject(LessonService);
  private readonly progresoService = inject(ProgresoService);
  private readonly insigniaService = inject(InsigniaService);

  constructor() {
    this.progresoService.loadMiProgreso().subscribe();
  }

  readonly user = this.authService.currentUser;

  readonly lecciones = toSignal(
    this.lessonService.getLecciones().pipe(catchError(() => of([]))),
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

  readonly completedIds = computed(
    () => new Set(this.progreso().filter((p) => p.completada).map((p) => p.leccionId)),
  );

  readonly completedCount = computed(() => this.completedIds().size);

  readonly levelNum = computed(() => Math.floor((this.user()?.xpTotal ?? 0) / 100) + 1);
  readonly xpInLevel = computed(() => (this.user()?.xpTotal ?? 0) % 100);

  readonly streakDots = computed(() => {
    const racha = this.user()?.racha ?? 0;
    return Array.from({ length: 7 }, (_, i) => i < racha % 7);
  });

  readonly completedHistory = computed(() => {
    const lessonsMap = new Map(this.lecciones().map((l) => [l._id, l]));
    return this.progreso()
      .filter((p) => p.completada)
      .map((p) => {
        const lesson = lessonsMap.get(p.leccionId);
        return {
          leccionId: p.leccionId,
          titulo: lesson?.titulo ?? 'Lección desconocida',
          nivel: lesson?.nivel ?? '',
          xpObtenido: p.xpObtenido,
          intentos: p.intentos,
          fecha: p.fechaCompletado ? this.formatDate(p.fechaCompletado) : '',
        };
      });
  });

  readonly earnedIds = computed(
    () => new Set(this.insigniasGanadas().map((i) => i._id)),
  );

  readonly badgeList = computed(() =>
    this.insigniasAll().map((i) => ({
      ...i,
      earned: this.earnedIds().has(i._id),
      iconPath: badgeIconPath(i.condicion),
      color: badgeColor(i.condicion),
    })),
  );

  nivelColor(nivel: string): string {
    return LESSON_LEVEL_COLOR[nivel] ?? '#94A3B8';
  }

  formatDate(iso: string): string {
    return formatShortDate(iso);
  }
}
