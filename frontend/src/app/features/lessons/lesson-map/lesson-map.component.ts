import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { LESSON_LEVEL_ORDER } from '../../../core/constants/learning.constants';
import { LessonService, NivelLeccion } from '../../../core/services/lesson.service';
import { ProgresoService } from '../../../core/services/progreso.service';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';

type LessonState = 'completed' | 'available' | 'locked';

interface LessonNode {
  readonly _id: string;
  readonly titulo: string;
  readonly xp: number;
  readonly state: LessonState;
}

interface NivelCfg {
  readonly color: string;
  readonly bg: string;
  readonly border: string;
  readonly label: string;
}

interface LevelSection {
  readonly nivel: NivelLeccion;
  readonly cfg: NivelCfg;
  readonly lessons: readonly LessonNode[];
  readonly completedCount: number;
  readonly locked: boolean;
}

const NIVEL_CFG: Record<NivelLeccion, NivelCfg> = {
  'básico':     { color:'var(--blue)',   bg:'var(--blue-bg)',   border:'var(--blue-border)',   label:'Básico' },
  'intermedio': { color:'var(--violet)', bg:'var(--violet-bg)', border:'var(--violet-border)', label:'Intermedio' },
  'avanzado':   { color:'var(--orange)', bg:'var(--orange-bg)', border:'var(--orange-border)', label:'Avanzado' },
  'experto':    { color:'var(--gold)',   bg:'var(--gold-bg)',   border:'var(--gold-border)',   label:'Experto' },
};

@Component({
  selector: 'app-lesson-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TopbarComponent],
  styles: [`
    .lesson-node:hover .node-circle { transform: scale(1.08); }
    .node-circle { transition: transform 0.2s; }
  `],
  template: `
    <div class="min-h-screen" style="background:var(--bg)">
      <app-topbar />

      <main class="gl-main" style="max-width:640px;margin:0 auto">
        <div style="margin-bottom:32px">
          <h1 class="gl-page-title">Ruta de aprendizaje</h1>
          <p class="gl-page-subtitle">Domina Git desde los fundamentos hasta técnicas avanzadas</p>
        </div>

        @for (section of sections(); track section.nivel) {
          <div style="margin-bottom:12px">

            <!-- Level header -->
            <div style="display:flex;align-items:center;gap:12px;border-radius:var(--r-xl);padding:14px 20px"
                 [style.background]="section.cfg.bg"
                 [style.border]="'1.5px solid ' + section.cfg.border"
                 [style.opacity]="section.locked ? '0.55' : '1'">
              <div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0"
                   [style.background]="section.cfg.bg"
                   [style.border]="'2px solid ' + section.cfg.color">
                @if (section.nivel === 'básico') {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" [attr.stroke]="section.cfg.color" stroke-width="2" aria-hidden="true">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                }
                @if (section.nivel === 'intermedio') {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" [attr.stroke]="section.cfg.color" stroke-width="2.5" aria-hidden="true">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                }
                @if (section.nivel === 'avanzado') {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" [attr.stroke]="section.cfg.color" stroke-width="2" aria-hidden="true">
                    <path d="M12 2 2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                }
                @if (section.nivel === 'experto') {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" [attr.stroke]="section.cfg.color" stroke-width="2" aria-hidden="true">
                    <path d="M6 3h12l4 6-10 13L2 9 6 3z"/>
                  </svg>
                }
              </div>
              <div style="flex:1">
                <div style="font-size:16px;font-weight:800" [style.color]="section.cfg.color">{{ section.cfg.label }}</div>
                <div style="font-size:12px;color:var(--muted);margin-top:1px">
                  {{ section.locked ? 'Completa el nivel anterior para desbloquear' : section.completedCount + '/' + section.lessons.length + ' completadas' }}
                </div>
              </div>
              @if (!section.locked) {
                <div style="min-width:80px">
                  <div style="height:6px;background:var(--surface3);border-radius:var(--r-full);overflow:hidden">
                    <div style="height:100%;border-radius:var(--r-full);transition:width 0.4s ease"
                         [style.background]="section.cfg.color"
                         [style.width.%]="section.lessons.length ? (section.completedCount / section.lessons.length) * 100 : 0"></div>
                  </div>
                </div>
              }
              @if (section.locked) {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              }
            </div>

            <!-- Lessons path -->
            <div style="padding-top:4px;padding-bottom:8px">
              @for (lesson of section.lessons; track lesson._id; let idx = $index) {
                <div style="display:flex;flex-direction:column"
                     [style.align-items]="idx % 2 === 0 ? 'flex-start' : 'flex-end'">

                  <!-- Connector from header (first) or between nodes -->
                  <div style="width:4px;border-radius:2px;transition:background 0.5s"
                       [style.height]="idx === 0 ? '20px' : '28px'"
                       [style.background]="idx > 0 && section.lessons[idx-1].state === 'completed' ? 'var(--green)' : 'var(--border)'"
                       [style.margin-left]="idx % 2 === 0 ? '52px' : 'auto'"
                       [style.margin-right]="idx % 2 === 0 ? 'auto' : '52px'">
                  </div>

                  <!-- Node + card row -->
                  @if (lesson.state !== 'locked') {
                    <a [routerLink]="['/app/lecciones', lesson._id]"
                       class="lesson-node"
                       style="display:flex;align-items:center;gap:14px;background:none;border:none;padding:0 4px;width:100%;text-decoration:none;cursor:pointer"
                       [style.flex-direction]="idx % 2 === 0 ? 'row' : 'row-reverse'"
                       [attr.aria-label]="lesson.titulo">

                      <!-- Circle node -->
                      <div class="node-circle" style="width:56px;height:56px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:3px solid"
                           [style.border-color]="lesson.state === 'completed' ? 'var(--green)' : section.cfg.color"
                           [style.background]="lesson.state === 'completed' ? 'var(--green-bg)' : section.cfg.bg"
                           [style.box-shadow]="lesson.state === 'available' ? '0 0 0 4px ' + section.cfg.bg : 'none'">
                        @if (lesson.state === 'completed') {
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        } @else {
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" [attr.stroke]="section.cfg.color" stroke-width="2" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        }
                      </div>

                      <!-- Info card -->
                      <div style="flex:1;border-radius:var(--r-xl);padding:12px 16px;text-align:left;transition:all 0.15s;border:1.5px solid"
                           [style.background]="'var(--surface2)'"
                           [style.border-color]="lesson.state === 'completed' ? 'var(--green-border)' : section.cfg.border">
                        <div style="font-size:15px;font-weight:700;margin-bottom:4px;color:var(--text)">{{ lesson.titulo }}</div>
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                          <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--gold);background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:var(--r-full);padding:2px 8px">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                            {{ lesson.xp }} XP
                          </span>
                          @if (lesson.state === 'completed') {
                            <span style="font-size:12px;color:var(--green);font-weight:600">Completada</span>
                          }
                        </div>
                      </div>
                    </a>
                  } @else {
                    <!-- Locked node -->
                    <div style="display:flex;align-items:center;gap:14px;padding:0 4px;width:100%;opacity:0.5;cursor:default"
                         [style.flex-direction]="idx % 2 === 0 ? 'row' : 'row-reverse'">
                      <div style="width:56px;height:56px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:3px solid var(--border);background:var(--surface2)">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <div style="flex:1;border-radius:var(--r-xl);padding:12px 16px;text-align:left;border:1.5px solid var(--border);background:var(--surface)">
                        <div style="font-size:15px;font-weight:700;color:var(--muted);margin-bottom:4px">{{ lesson.titulo }}</div>
                        <div style="display:flex;align-items:center;gap:8px">
                          <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--gold);background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:var(--r-full);padding:2px 8px">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                            {{ lesson.xp }} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        } @empty {
          <div style="display:flex;align-items:center;justify-content:center;padding:96px 0">
            <p style="font-size:14px;color:var(--text2)">Cargando lecciones…</p>
          </div>
        }
      </main>
    </div>
  `,
})
export class LessonMapComponent {
  private readonly lessonService = inject(LessonService);
  private readonly progresoService = inject(ProgresoService);

  constructor() {
    this.progresoService.loadMiProgreso().subscribe();
  }

  private readonly lecciones = toSignal(
    this.lessonService.getLecciones().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  private readonly progreso = this.progresoService.misProgreso;

  readonly sections = computed<LevelSection[]>(() => {
    const lecciones = this.lecciones();
    const progreso = this.progreso();

    if (!lecciones.length) return [];

    const completedIds = new Set(
      progreso.filter((p) => p.completada).map((p) => p.leccionId),
    );

    const isLevelLocked = (nivel: NivelLeccion): boolean => {
      const idx = LESSON_LEVEL_ORDER.indexOf(nivel);
      if (idx === 0) return false;
      const prevNivel = LESSON_LEVEL_ORDER[idx - 1];
      const prevLessons = lecciones.filter((l) => l.nivel === prevNivel);
      return !prevLessons.every((l) => completedIds.has(l._id));
    };

    return LESSON_LEVEL_ORDER
      .map((nivel) => {
        const levelLessons = lecciones
          .filter((l) => l.nivel === nivel)
          .sort((a, b) => a.orden - b.orden);

        if (!levelLessons.length) return null;

        const locked = isLevelLocked(nivel);

        const nodes = levelLessons.map((l): LessonNode => ({
          _id: l._id,
          titulo: l.titulo,
          xp: l.xpRecompensa,
          state: completedIds.has(l._id) ? 'completed' : locked ? 'locked' : 'available',
        }));

        const section: LevelSection = {
          nivel,
          cfg: NIVEL_CFG[nivel],
          lessons: nodes,
          completedCount: nodes.filter((n) => n.state === 'completed').length,
          locked,
        };
        return section;
      })
      .filter((s): s is LevelSection => s !== null);
  });
}
