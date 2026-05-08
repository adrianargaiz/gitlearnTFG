import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { LESSON_LEVEL_COLOR } from '../../../core/constants/learning.constants';
import { AsignacionConDetalle, AsignacionService } from '../../../core/services/asignacion.service';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';

@Component({
  selector: 'app-tareas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TopbarComponent],
  template: `
    <div class="min-h-screen" style="background:var(--bg)">
      <app-topbar />

      <main class="gl-main" style="max-width:800px;margin:0 auto">
        <header style="margin-bottom:32px">
          <h1 class="gl-page-title">Tareas asignadas</h1>
          <p class="gl-page-subtitle">Lecciones que tu profesor te ha asignado</p>
        </header>

        <!-- Tabs pendientes / completadas -->
        <div class="gl-tabs" style="margin-bottom:24px">
          <button type="button" class="gl-tab" [class.active]="tab() === 'pendientes'"
            (click)="tab.set('pendientes')">
            Pendientes
            @if (pendientes().length > 0) {
              <span class="ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                    [style.background]="tab() === 'pendientes' ? 'var(--green-bg)' : 'rgba(255,255,255,0.06)'"
                    [style.color]="tab() === 'pendientes' ? 'var(--green)' : 'var(--grey)'">
                {{ pendientes().length }}
              </span>
            }
          </button>
          <button type="button" class="gl-tab" [class.active]="tab() === 'completadas'"
            (click)="tab.set('completadas')">
            Completadas
            @if (completadas().length > 0) {
              <span class="ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                    [style.background]="tab() === 'completadas' ? 'var(--surface3)' : 'rgba(255,255,255,0.06)'"
                    [style.color]="tab() === 'completadas' ? 'var(--muted)' : 'var(--grey)'">
                {{ completadas().length }}
              </span>
            }
          </button>
        </div>

        <!-- Lista -->
        @if (visible().length === 0) {
          <div class="gl-card flex flex-col items-center" style="padding:64px 24px;text-align:center">
            <div class="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                 style="background:var(--surface2);border:1.5px solid var(--border)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   stroke-width="1.5" style="color:var(--muted)" aria-hidden="true">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
              </svg>
            </div>
            <p style="font-weight:700;color:var(--text2);font-size:14px">
              {{ tab() === 'pendientes' ? 'Sin tareas pendientes' : 'Aún no has completado ninguna tarea' }}
            </p>
            <p style="font-size:13px;color:var(--muted);margin-top:4px">
              {{ tab() === 'pendientes' ? 'Tu profesor no te ha asignado nada todavía.' : 'Completa las tareas pendientes para verlas aquí.' }}
            </p>
          </div>
        }

        <div style="display:flex;flex-direction:column;gap:12px">
          @for (tarea of visible(); track tarea._id) {
            <div class="gl-card"
                 style="padding:20px 24px;display:flex;align-items:center;gap:20px"
                 [style.borderColor]="tarea.completada ? 'var(--border)' : 'var(--green-border)'">

              <!-- Nivel color bar -->
              <div style="width:4px;height:52px;border-radius:var(--r-full);flex-shrink:0"
                   [style.background]="nivelColor(tarea.leccionId.nivel)"></div>

              <!-- Info -->
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
                  <span style="font-weight:700;font-size:14px;color:var(--text)">
                    {{ tarea.titulo ?? tarea.leccionId.titulo }}
                  </span>
                  <span class="gl-badge"
                        [style.color]="nivelColor(tarea.leccionId.nivel)"
                        [style.borderColor]="nivelColor(tarea.leccionId.nivel) + '40'"
                        [style.background]="nivelColor(tarea.leccionId.nivel) + '18'">
                    {{ tarea.leccionId.nivel }}
                  </span>
                  @if (tarea.completada) {
                    <span class="gl-badge gl-badge-green">Completada</span>
                  }
                </div>

                <div style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:440px">
                  {{ tarea.leccionId.descripcion }}
                </div>

                <div style="display:flex;align-items:center;gap:16px;margin-top:8px">
                  <span class="gl-badge gl-badge-gold" style="gap:4px">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    {{ tarea.leccionId.xpRecompensa }} XP
                  </span>
                  @if (tarea.fechaLimite) {
                    <span style="font-size:12px;display:flex;align-items:center;gap:4px"
                          [style.color]="isVencida(tarea.fechaLimite) && !tarea.completada ? 'var(--red)' : 'var(--muted)'">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Límite: {{ formatDate(tarea.fechaLimite) }}
                      @if (isVencida(tarea.fechaLimite) && !tarea.completada) {
                        · Vencida
                      }
                    </span>
                  }
                </div>
              </div>

              <!-- Action -->
              @if (!tarea.completada) {
                <a [routerLink]="['/app/lecciones', tarea.leccionId._id]"
                   [queryParams]="{ from: 'tareas' }"
                   class="gl-btn gl-btn-md gl-btn-primary"
                   style="flex-shrink:0">
                  Comenzar
                </a>
              } @else {
                <a [routerLink]="['/app/lecciones', tarea.leccionId._id]"
                   [queryParams]="{ from: 'tareas' }"
                   class="gl-btn gl-btn-md gl-btn-ghost"
                   style="flex-shrink:0">
                  Repasar
                </a>
              }
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class TareasComponent {
  private readonly asignacionService = inject(AsignacionService);

  private readonly asignaciones = toSignal(
    this.asignacionService.getMisAsignaciones().pipe(catchError(() => of([]))),
    { initialValue: [] as AsignacionConDetalle[] }
  );

  readonly tab = signal<'pendientes' | 'completadas'>('pendientes');

  readonly pendientes = computed(() => this.asignaciones().filter((a) => !a.completada));
  readonly completadas = computed(() => this.asignaciones().filter((a) => a.completada));
  readonly visible = computed(() =>
    this.tab() === 'pendientes' ? this.pendientes() : this.completadas()
  );

  nivelColor(nivel: string): string {
    return LESSON_LEVEL_COLOR[nivel] ?? '#94A3B8';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  isVencida(fechaLimite: string): boolean {
    return new Date(fechaLimite) < new Date();
  }
}
