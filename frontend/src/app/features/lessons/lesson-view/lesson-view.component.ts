import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { badgeColor, badgeIconPath } from '../../../core/constants/learning.constants';
import { Ejercicio, ExerciseService } from '../../../core/services/exercise.service';
import { LessonService } from '../../../core/services/lesson.service';
import { CompletarProgresoResult, ProgresoService } from '../../../core/services/progreso.service';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import {
  DEFAULT_EXERCISE_STATE,
  ExerciseAnswerState,
  isExerciseCorrect,
  seededShuffle,
} from './lesson-exercise.utils';

@Component({
  selector: 'app-lesson-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TopbarComponent],
  styles: [`
    .opt-btn { transition: background 0.15s, border-color 0.15s, color 0.15s; cursor: pointer; }
    .opt-btn:disabled { cursor: default; }
    .sort-item { transition: background 0.15s, border-color 0.15s, transform 0.1s; cursor: pointer; }
    .sort-item.picked { transform: scale(1.02); }
    .match-btn { transition: background 0.15s, border-color 0.15s; cursor: pointer; }
    .match-btn:disabled { cursor: default; }
    .token-chip { transition: background 0.12s, border-color 0.12s, transform 0.1s; cursor: pointer; }
    .token-chip:disabled { cursor: not-allowed; opacity: 0.4; }
    .token-chip:not(:disabled):hover { transform: translateY(-1px); }
    .code-line { transition: background 0.12s, border-color 0.12s; cursor: pointer; user-select: none; }
    .code-line:disabled { cursor: default; }
  `],
  template: `
    <div class="min-h-screen" style="background:var(--bg)">
      <app-topbar />

      <main class="gl-main" style="max-width:640px;margin:0 auto">

        <!-- ── Finish screen ─────────────────────────────────────────────── -->
        @if (finishResult(); as result) {
          <div style="max-width:520px;margin:0 auto;display:flex;flex-direction:column;align-items:center;gap:28px;padding:48px 0;text-align:center">
            <div style="width:80px;height:80px;border-radius:50%;background:var(--green-bg);border:3px solid var(--green);display:flex;align-items:center;justify-content:center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="1.5" aria-hidden="true">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
              </svg>
            </div>
            <div>
              <h1 style="font-size:28px;font-weight:900;margin-bottom:8px;color:var(--text)">¡Lección completada!</h1>
              <p style="font-size:15px;color:var(--text2)">{{ lesson()?.titulo }}</p>
            </div>

            <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
              <div style="display:inline-flex;align-items:center;gap:12px;background:var(--gold-bg);border:2px solid var(--gold-border);border-radius:var(--r-xl);padding:16px 32px">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <span style="font-size:30px;font-weight:900;color:var(--gold)">+{{ result.xpGanado }} XP</span>
              </div>
              <div style="font-size:13px;color:var(--text2)">
                Aciertos: <span style="font-weight:700;color:var(--text)">{{ result.aciertos }}/{{ result.total }}</span>
                @if (result.total > 0) {
                  · {{ scorePercent(result) }}%
                }
              </div>
            </div>

            @if (result.insigniasNuevas.length > 0) {
              <div>
                <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px">Insignia desbloqueada</div>
                <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
                  @for (badge of result.insigniasNuevas; track badge._id) {
                    <div style="display:inline-flex;align-items:center;gap:12px;border:1.5px solid;border-radius:var(--r-xl);padding:12px 20px"
                         [style.background]="badgeColor(badge.condicion) + '18'"
                         [style.border-color]="badgeColor(badge.condicion) + '50'">
                      <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0"
                           [style.background]="badgeColor(badge.condicion) + '30'">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
                             [attr.stroke]="badgeColor(badge.condicion)">
                          <path [attr.d]="badgeIcon(badge.condicion)"/>
                        </svg>
                      </div>
                      <div style="text-align:left">
                        <div style="font-size:14px;font-weight:700" [style.color]="badgeColor(badge.condicion)">{{ badge.nombre }}</div>
                        <div style="font-size:12px;color:var(--muted)">{{ badge.descripcion }}</div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <a routerLink="/app/lecciones" class="gl-btn gl-btn-lg gl-btn-primary" style="display:inline-flex">
              Volver al mapa
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a1a00" stroke-width="2" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </a>
          </div>

        <!-- ── Exercise screen ───────────────────────────────────────────── -->
        } @else if (current(); as ex) {

          <!-- Progress header -->
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
            <a routerLink="/app/lecciones"
               class="gl-btn gl-btn-sm gl-btn-ghost"
               style="padding:8px;border-radius:var(--r-md);flex-shrink:0"
               aria-label="Volver al mapa">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </a>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
                <span style="font-size:15px;font-weight:800;color:var(--text)">{{ lesson()?.titulo ?? '…' }}</span>
                <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:var(--r-full);border:1px solid"
                      [style.color]="nivelColor(lesson()?.nivel)"
                      [style.border-color]="nivelColor(lesson()?.nivel) + '50'"
                      [style.background]="nivelColor(lesson()?.nivel) + '18'">{{ lesson()?.nivel }}</span>
                <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;color:var(--gold);background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:var(--r-full);padding:2px 8px">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  {{ lesson()?.xpRecompensa }} XP
                </span>
              </div>
              <div style="display:flex;align-items:center;gap:10px">
                <div style="flex:1;height:8px;background:var(--surface3);border-radius:var(--r-full);overflow:hidden">
                  <div style="height:100%;border-radius:var(--r-full);transition:width 0.4s ease"
                       [style.background]="nivelColor(lesson()?.nivel)"
                       [style.width.%]="progressPercent()"></div>
                </div>
                <span style="font-size:12px;color:var(--muted);font-weight:600;white-space:nowrap">{{ currentIndex() + 1 }} / {{ exercises().length }}</span>
              </div>
            </div>
          </div>

          <!-- Exercise card -->
          <div class="gl-card" style="margin-bottom:16px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px"
                 [style.color]="typeColor(ex.tipo)">
              {{ typeLabel(ex.tipo) }}
            </div>
            <p style="font-size:17px;font-weight:700;line-height:1.55;margin-bottom:22px;color:var(--text)">{{ ex.enunciado }}</p>

            <!-- ── Opción múltiple ────────────────────────────────────────── -->
            @if (ex.tipo === 'opcionMultiple') {
              <div style="display:flex;flex-direction:column;gap:9px" role="radiogroup" [attr.aria-label]="ex.enunciado">
                @for (opt of mcOptions(); track opt; let i = $index) {
                  <button type="button" class="opt-btn"
                    [disabled]="submitted()"
                    (click)="select(opt)"
                    style="display:flex;align-items:center;gap:12px;padding:13px 16px;border-radius:var(--r-lg);border:1.5px solid;text-align:left;width:100%;font-size:14px;font-weight:600"
                    [style.background]="optBg(ex, opt)"
                    [style.border-color]="optBorder(ex, opt)"
                    [style.color]="optColor(ex, opt)">
                    <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--surface3);border:1.5px solid var(--border);font-size:11px;font-weight:800;color:var(--muted);flex-shrink:0">
                      {{ letterFor(i) }}
                    </span>
                    <span style="flex:1">{{ opt }}</span>
                    @if (submitted() && opt === asString(ex.respuestaCorrecta)) {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    }
                    @if (submitted() && opt === selected() && opt !== asString(ex.respuestaCorrecta)) {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    }
                  </button>
                }
              </div>
            }

            <!-- ── Rellenar huecos ─────────────────────────────────────────── -->
            @if (ex.tipo === 'rellenarHuecos') {
              <div>
                <label class="gl-label" [attr.for]="'fill-' + ex._id">Escribe tu respuesta</label>
                <div style="position:relative">
                  <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--muted);pointer-events:none">$</span>
                  <input [id]="'fill-' + ex._id" type="text"
                    [value]="selected() ?? ''"
                    (input)="onTextInput($event)"
                    [disabled]="submitted()"
                    autocomplete="off" spellcheck="false"
                    placeholder="git ..."
                    style="font-family:monospace;font-size:15px;padding-left:28px;width:100%"
                    [class]="submitted() && !isCorrect() ? 'gl-input error' : 'gl-input'"
                    (keydown.enter)="canSubmit() && !submitted() ? submit() : null"/>
                </div>
              </div>
            }

            <!-- ── Arrastrar y soltar (reorden por clic) ───────────────────── -->
            @if (ex.tipo === 'arrastrarSoltar') {
              <div style="display:flex;flex-direction:column;gap:8px" aria-label="Reordena los elementos">
                @for (item of currentOrder(); track item; let i = $index) {
                  <button type="button" class="sort-item"
                    [class.picked]="!submitted() && swapPickedIdx() === i"
                    [disabled]="submitted()"
                    (click)="swapItems(i)"
                    style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:var(--r-lg);border:1.5px solid;text-align:left;width:100%;font-size:14px;font-weight:600"
                    [style.background]="sortItemBg(i)"
                    [style.border-color]="sortItemBorder(i)">
                    <span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:var(--r-md);background:var(--surface3);border:1px solid var(--border);font-size:11px;font-weight:800;color:var(--muted);flex-shrink:0">
                      {{ i + 1 }}
                    </span>
                    <span style="flex:1;font-family:monospace" [style.color]="sortItemColor(i)">{{ item }}</span>
                    @if (!submitted()) {
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2" aria-hidden="true">
                        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                      </svg>
                    }
                    @if (submitted()) {
                      @if (sortItemIsCorrect(i)) {
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                      } @else {
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      }
                    }
                  </button>
                }
                @if (!submitted()) {
                  <p style="font-size:12px;color:var(--muted);margin-top:4px;text-align:center">
                    @if (swapPickedIdx() !== null) {
                      Ahora haz clic en otro elemento para intercambiarlos
                    } @else {
                      Haz clic en un elemento para seleccionarlo, luego en otro para intercambiarlos
                    }
                  </p>
                }
              </div>
            }

            <!-- ── Emparejar ───────────────────────────────────────────────── -->
            @if (ex.tipo === 'emparejar') {
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <!-- Left: terms -->
                <div style="display:flex;flex-direction:column;gap:7px">
                  <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Concepto</div>
                  @for (left of ex.opciones; track left) {
                    <button type="button" class="match-btn"
                      [disabled]="submitted()"
                      (click)="matchLeft(left)"
                      style="padding:10px 14px;border-radius:var(--r-lg);border:1.5px solid;font-size:13px;font-weight:700;text-align:left;width:100%;font-family:monospace"
                      [style.background]="matchLeftBg(ex, left)"
                      [style.border-color]="matchLeftBorder(ex, left)"
                      [style.color]="matchLeftColor(ex, left)">
                      {{ left }}
                    </button>
                  }
                </div>
                <!-- Right: definitions (shuffled) -->
                <div style="display:flex;flex-direction:column;gap:7px">
                  <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Definición</div>
                  @for (right of rightColumn(); track right) {
                    <button type="button" class="match-btn"
                      [disabled]="submitted() || isRightMatched(right)"
                      (click)="matchRight(right)"
                      style="padding:10px 14px;border-radius:var(--r-lg);border:1.5px solid;font-size:13px;font-weight:600;text-align:left;width:100%;min-height:45px"
                      [style.background]="matchRightBg(ex, right)"
                      [style.border-color]="matchRightBorder(ex, right)"
                      [style.color]="matchRightColor(ex, right)">
                      {{ right }}
                    </button>
                  }
                </div>
              </div>
              @if (!submitted()) {
                <div style="margin-top:12px;display:flex;align-items:center;gap:6px">
                  <div style="flex:1;height:4px;background:var(--surface3);border-radius:var(--r-full);overflow:hidden">
                    <div style="height:100%;background:var(--green);border-radius:var(--r-full);transition:width 0.3s"
                         [style.width.%]="matchProgress(ex)"></div>
                  </div>
                  <span style="font-size:11px;color:var(--muted);font-weight:600;white-space:nowrap">{{ matchedCount() }} / {{ ex.opciones.length }}</span>
                </div>
              }
            }

            <!-- ── Construir comando ───────────────────────────────────────── -->
            @if (ex.tipo === 'construirComando') {
              <!-- Construction area: ordered tokens chosen so far -->
              <div style="min-height:62px;padding:14px;border-radius:var(--r-lg);border:1.5px dashed var(--border);background:var(--surface2);margin-bottom:14px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-family:monospace">
                <span style="color:var(--muted);font-size:13px;font-weight:700;margin-right:4px">$</span>
                @if (currentTokens().length === 0 && !submitted()) {
                  <span style="font-size:13px;color:var(--muted);font-style:italic">Pulsa los tokens de abajo para construir el comando…</span>
                }
                @for (entry of currentTokens(); track entry.idx) {
                  <button type="button" class="token-chip"
                    [disabled]="submitted()"
                    (click)="removeToken(entry.idx)"
                    style="padding:7px 12px;border-radius:var(--r-md);border:1.5px solid;font-size:14px;font-weight:700;font-family:monospace;display:inline-flex;align-items:center;gap:6px"
                    [style.background]="commandTokenBg(entry.idx)"
                    [style.border-color]="commandTokenBorder(entry.idx)"
                    [style.color]="commandTokenColor(entry.idx)">
                    {{ entry.value }}
                    @if (!submitted()) {
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    }
                  </button>
                }
              </div>
              <!-- Pool: available tokens (shuffled per exercise) -->
              <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Tokens disponibles</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                @for (entry of buildPool(); track entry.idx) {
                  <button type="button" class="token-chip"
                    [disabled]="submitted() || isTokenUsed(entry.idx)"
                    (click)="addToken(entry.idx)"
                    style="padding:8px 14px;border-radius:var(--r-md);border:1.5px solid var(--border);font-size:14px;font-weight:700;font-family:monospace;background:var(--surface2);color:var(--text)">
                    {{ entry.value }}
                  </button>
                }
              </div>
              @if (!submitted()) {
                <p style="font-size:12px;color:var(--muted);margin-top:10px;text-align:center">
                  Algunos tokens son distractores. Pulsa un chip elegido para devolverlo al pool.
                </p>
              }
            }

            <!-- ── Detectar error en código ────────────────────────────────── -->
            @if (ex.tipo === 'detectarError') {
              <div style="border-radius:var(--r-lg);border:1.5px solid var(--border);background:#0d1117;overflow:hidden">
                @for (line of ex.opciones; track $index) {
                  <button type="button" class="code-line"
                    [disabled]="submitted()"
                    (click)="toggleErrorLine($index)"
                    style="display:flex;align-items:stretch;width:100%;border:none;background:transparent;text-align:left;padding:0;border-left:3px solid transparent"
                    [style.background]="errorLineBg($index)"
                    [style.border-left-color]="errorLineBorder($index)">
                    <span style="display:inline-flex;align-items:center;justify-content:flex-end;min-width:42px;padding:8px 12px;font-family:monospace;font-size:12px;color:var(--muted);background:rgba(255,255,255,0.03);user-select:none;flex-shrink:0">
                      {{ $index + 1 }}
                    </span>
                    <span style="flex:1;padding:8px 14px;font-family:monospace;font-size:13px;white-space:pre;overflow-x:auto"
                          [style.color]="errorLineColor($index)">{{ line }}</span>
                    <span style="display:inline-flex;align-items:center;padding:0 12px;flex-shrink:0">
                      @if (submitted()) {
                        @if (errorLineResult($index) === 'correctFlag') {
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        } @else if (errorLineResult($index) === 'wrongFlag') {
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        } @else if (errorLineResult($index) === 'missed') {
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        }
                      } @else if (isLineFlagged($index)) {
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--error)" stroke="var(--error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                        </svg>
                      }
                    </span>
                  </button>
                }
              </div>
              @if (!submitted()) {
                <p style="font-size:12px;color:var(--muted);margin-top:10px;text-align:center">
                  Pulsa la(s) línea(s) que contengan errores para marcarlas con una bandera.
                </p>
              }
            }

            <!-- ── Feedback ─────────────────────────────────────────────────── -->
            @if (submitted()) {
              <div style="margin-top:18px;padding:14px 16px;border-radius:var(--r-lg);border:1.5px solid"
                   [style.background]="isCorrect() ? 'var(--green-bg)' : 'var(--error-bg)'"
                   [style.border-color]="isCorrect() ? 'var(--green-border)' : 'var(--error-border)'"
                   role="status" aria-live="polite">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                  @if (isCorrect()) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style="font-weight:700;color:var(--green);font-size:14px">¡Correcto!</span>
                  } @else {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2.5" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span style="font-weight:700;color:var(--error);font-size:14px">Incorrecto</span>
                  }
                </div>

                @if (!isCorrect()) {
                  @if (ex.tipo === 'arrastrarSoltar') {
                    <div style="margin-bottom:8px">
                      <span style="font-size:12px;font-weight:700;color:var(--text2)">Orden correcto:</span>
                      <div style="margin-top:6px;display:flex;flex-direction:column;gap:4px">
                        @for (item of asArray(ex.respuestaCorrecta); track item; let i = $index) {
                          <span style="font-size:12px;color:var(--text2);font-family:monospace">{{ i + 1 }}. {{ item }}</span>
                        }
                      </div>
                    </div>
                  }
                  @if (ex.tipo === 'emparejar') {
                    <div style="margin-bottom:8px">
                      <span style="font-size:12px;font-weight:700;color:var(--text2)">Pares correctos:</span>
                      <div style="margin-top:6px;display:flex;flex-direction:column;gap:4px">
                        @for (pair of asArray(ex.respuestaCorrecta); track pair) {
                          <span style="font-size:12px;color:var(--text2);font-family:monospace">{{ pair.split('||')[0] }} → {{ pair.split('||')[1] }}</span>
                        }
                      </div>
                    </div>
                  }
                  @if (ex.tipo === 'rellenarHuecos') {
                    <div style="margin-bottom:8px">
                      <span style="font-size:12px;font-weight:700;color:var(--text2)">Respuesta correcta: </span>
                      <code style="font-size:13px;color:var(--text);font-family:monospace;background:var(--surface3);padding:2px 6px;border-radius:4px">{{ asString(ex.respuestaCorrecta) }}</code>
                    </div>
                  }
                  @if (ex.tipo === 'construirComando') {
                    <div style="margin-bottom:8px">
                      <span style="font-size:12px;font-weight:700;color:var(--text2)">Comando correcto: </span>
                      <code style="font-size:13px;color:var(--text);font-family:monospace;background:var(--surface3);padding:2px 6px;border-radius:4px">{{ asArray(ex.respuestaCorrecta).join(' ') }}</code>
                    </div>
                  }
                  @if (ex.tipo === 'detectarError') {
                    <div style="margin-bottom:8px">
                      <span style="font-size:12px;font-weight:700;color:var(--text2)">Líneas con error: </span>
                      <span style="font-size:13px;color:var(--text);font-family:monospace">{{ correctErrorLineLabels(ex) }}</span>
                    </div>
                  }
                }

                @if (ex.explicacion) {
                  <p style="font-size:13px;color:var(--text2);line-height:1.6;margin-top:4px">{{ ex.explicacion }}</p>
                }
              </div>
            }
          </div>

          <!-- Action button -->
          <div style="display:flex;justify-content:flex-end">
            @if (!submitted()) {
              <button type="button" (click)="submit()" [disabled]="!canSubmit()"
                class="gl-btn gl-btn-lg gl-btn-primary">
                Comprobar
              </button>
            } @else {
              <button type="button" (click)="next()" [disabled]="finishing()"
                class="gl-btn gl-btn-lg gl-btn-primary">
                {{ currentIndex() === exercises().length - 1
                    ? (finishing() ? 'Guardando…' : 'Finalizar lección')
                    : 'Siguiente' }}
                @if (!finishing()) {
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a1a00" stroke-width="2.5" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                }
              </button>
            }
          </div>

        <!-- ── Loading ─────────────────────────────────────────────────────── -->
        } @else {
          <div style="display:flex;align-items:center;justify-content:center;padding:96px 0">
            <p style="font-size:14px;color:var(--text2)">Cargando ejercicios…</p>
          </div>
        }

      </main>
    </div>
  `,
})
export class LessonViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly lessonService = inject(LessonService);
  private readonly exerciseService = inject(ExerciseService);
  private readonly progresoService = inject(ProgresoService);

  private readonly id$ = this.route.paramMap.pipe(
    map((p) => p.get('id') ?? ''),
    distinctUntilChanged(),
  );

  readonly lesson = toSignal(
    this.id$.pipe(switchMap((id) => this.lessonService.getLeccion(id).pipe(catchError(() => of(null))))),
    { initialValue: null },
  );

  readonly exercises = toSignal(
    this.id$.pipe(switchMap((id) => this.exerciseService.getEjercicios(id).pipe(catchError(() => of([]))))),
    { initialValue: [] as Ejercicio[] },
  );

  // ── Navigation ────────────────────────────────────────────────────────────

  readonly currentIndex = signal(0);
  private readonly exerciseStates = signal<Record<number, ExerciseAnswerState>>({});
  readonly finishing = signal(false);
  readonly finishResult = signal<CompletarProgresoResult | null>(null);

  // ── Transient interaction state (reset on exercise change) ────────────────

  readonly swapPickedIdx = signal<number | null>(null);
  readonly matchPickedLeft = signal<string | null>(null);
  readonly rightColumn = signal<string[]>([]);

  constructor() {
    effect(() => {
      const ex = this.current();
      this.swapPickedIdx.set(null);
      this.matchPickedLeft.set(null);
      if (ex?.tipo === 'emparejar' && Array.isArray(ex.respuestaCorrecta)) {
        const rights = (ex.respuestaCorrecta as readonly string[]).map((p) => p.split('||')[1]);
        const seed = ex._id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
        this.rightColumn.set(seededShuffle(rights, seed));
      } else {
        this.rightColumn.set([]);
      }
    }, { allowSignalWrites: true });
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  readonly current = computed(() => this.exercises()[this.currentIndex()] ?? null);

  private readonly currentState = computed<ExerciseAnswerState>(() =>
    this.exerciseStates()[this.currentIndex()] ?? DEFAULT_EXERCISE_STATE,
  );

  readonly selected = computed(() => this.currentState().selected);
  readonly submitted = computed(() => this.currentState().submitted);

  readonly currentOrder = computed<string[]>(() => {
    const ex = this.current();
    const state = this.currentState();
    if (!ex || ex.tipo !== 'arrastrarSoltar') return [];
    return state.order ?? [...ex.opciones];
  });

  readonly progressPercent = computed(() => {
    const total = this.exercises().length;
    if (!total) return 0;
    return ((this.currentIndex() + (this.submitted() ? 1 : 0)) / total) * 100;
  });

  readonly isCorrect = computed(() => isExerciseCorrect(this.current(), this.currentState()));

  readonly canSubmit = computed(() => {
    const ex = this.current();
    const state = this.currentState();
    if (!ex) return false;
    switch (ex.tipo) {
      case 'opcionMultiple': return state.selected !== null;
      case 'rellenarHuecos': return (state.selected ?? '').trim().length > 0;
      case 'arrastrarSoltar': return true;
      case 'emparejar': return ex.opciones.every((l) => state.matches[l] !== undefined);
      case 'construirComando': return state.tokenIndices.length > 0;
      case 'detectarError': return state.flaggedLines.length > 0;
    }
  });

  readonly matchedCount = computed(() => Object.keys(this.currentState().matches).length);

  readonly currentTokens = computed<{ idx: number; value: string }[]>(() => {
    const ex = this.current();
    const state = this.currentState();
    if (!ex || ex.tipo !== 'construirComando') return [];
    return state.tokenIndices.map((idx) => ({ idx, value: ex.opciones[idx] ?? '' }));
  });

  // Shuffled options for opcionMultiple, deterministic per exercise (stable across reloads).
  readonly mcOptions = computed<readonly string[]>(() => {
    const ex = this.current();
    if (!ex || ex.tipo !== 'opcionMultiple') return [];
    return seededShuffle(ex.opciones, this.shuffleSeed(ex._id));
  });

  // Shuffled token pool for construirComando, paired with original index so state.tokenIndices
  // (which compares against ex.opciones[idx]) keeps working unchanged.
  readonly buildPool = computed<readonly { idx: number; value: string }[]>(() => {
    const ex = this.current();
    if (!ex || ex.tipo !== 'construirComando') return [];
    const indexed = ex.opciones.map((value, idx) => ({ idx, value }));
    return seededShuffle(indexed, this.shuffleSeed(ex._id));
  });

  private shuffleSeed(id: string): number {
    return id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  }

  // ── Type helpers ──────────────────────────────────────────────────────────

  typeLabel(tipo: Ejercicio['tipo']): string {
    const map: Record<Ejercicio['tipo'], string> = {
      opcionMultiple: 'Elige la respuesta correcta',
      rellenarHuecos: 'Completa el comando',
      arrastrarSoltar: 'Ordena los pasos correctamente',
      emparejar: 'Conecta cada concepto con su definición',
      construirComando: 'Construye el comando',
      detectarError: 'Encuentra los errores',
    };
    return map[tipo];
  }

  typeColor(tipo: Ejercicio['tipo']): string {
    const map: Record<Ejercicio['tipo'], string> = {
      opcionMultiple: 'var(--green)',
      rellenarHuecos: 'var(--blue)',
      arrastrarSoltar: 'var(--violet)',
      emparejar: 'var(--orange)',
      construirComando: '#06B6D4',
      detectarError: '#EF4444',
    };
    return map[tipo];
  }

  nivelColor(nivel: string | undefined): string {
    const map: Record<string, string> = {
      'básico': '#3B82F6', 'intermedio': '#7C3AED', 'avanzado': '#F97316', 'experto': '#D29922',
    };
    return map[nivel ?? ''] ?? '#3B82F6';
  }

  badgeColor(condicion: string): string { return badgeColor(condicion); }
  badgeIcon(condicion: string): string { return badgeIconPath(condicion); }

  scorePercent(result: { aciertos: number; total: number }): number {
    return result.total > 0 ? Math.round((result.aciertos / result.total) * 100) : 0;
  }

  letterFor(i: number): string { return String.fromCharCode(65 + i); }
  asString(v: string | readonly string[]): string { return Array.isArray(v) ? '' : (v as string); }
  asArray(v: string | readonly string[]): readonly string[] { return Array.isArray(v) ? v : [v as string]; }

  // ── opcionMultiple style helpers ──────────────────────────────────────────

  optBg(ex: Ejercicio, opt: string): string {
    if (!this.submitted()) return this.selected() === opt ? 'var(--blue-bg)' : 'var(--surface2)';
    if (opt === this.asString(ex.respuestaCorrecta)) return 'var(--green-bg)';
    if (opt === this.selected()) return 'var(--error-bg)';
    return 'var(--surface2)';
  }

  optBorder(ex: Ejercicio, opt: string): string {
    if (!this.submitted()) return this.selected() === opt ? 'var(--blue)' : 'var(--border)';
    if (opt === this.asString(ex.respuestaCorrecta)) return 'var(--green)';
    if (opt === this.selected()) return 'var(--error)';
    return 'var(--border)';
  }

  optColor(ex: Ejercicio, opt: string): string {
    if (!this.submitted()) return this.selected() === opt ? 'var(--text)' : 'var(--text2)';
    if (opt === this.asString(ex.respuestaCorrecta)) return 'var(--green)';
    if (opt === this.selected()) return 'var(--error)';
    return 'var(--muted)';
  }

  // ── arrastrarSoltar style helpers ─────────────────────────────────────────

  sortItemBg(i: number): string {
    if (!this.submitted()) return this.swapPickedIdx() === i ? 'var(--blue-bg)' : 'var(--surface2)';
    return this.sortItemIsCorrect(i) ? 'var(--green-bg)' : 'var(--error-bg)';
  }

  sortItemBorder(i: number): string {
    if (!this.submitted()) return this.swapPickedIdx() === i ? 'var(--blue)' : 'var(--border)';
    return this.sortItemIsCorrect(i) ? 'var(--green)' : 'var(--error)';
  }

  sortItemColor(i: number): string {
    if (!this.submitted()) return this.swapPickedIdx() === i ? 'var(--blue)' : 'var(--text2)';
    return this.sortItemIsCorrect(i) ? 'var(--green)' : 'var(--error)';
  }

  sortItemIsCorrect(i: number): boolean {
    const ex = this.current();
    if (!ex || !Array.isArray(ex.respuestaCorrecta)) return false;
    return this.currentOrder()[i] === (ex.respuestaCorrecta as readonly string[])[i];
  }

  // ── emparejar style helpers ───────────────────────────────────────────────

  private pairResult(ex: Ejercicio, left: string): 'correct' | 'wrong' | 'unmatched' {
    const matched = this.currentState().matches[left];
    if (!matched) return 'unmatched';
    if (!this.submitted()) return 'unmatched'; // don't reveal before submit
    const pairs = ex.respuestaCorrecta as readonly string[];
    const correctRight = pairs.find((p) => p.split('||')[0] === left)?.split('||')[1];
    return matched === correctRight ? 'correct' : 'wrong';
  }

  matchLeftBg(ex: Ejercicio, left: string): string {
    if (this.submitted()) {
      const r = this.pairResult(ex, left);
      if (r === 'correct') return 'var(--green-bg)';
      if (r === 'wrong') return 'var(--error-bg)';
    }
    if (this.matchPickedLeft() === left) return 'var(--blue-bg)';
    if (this.currentState().matches[left]) return 'var(--surface3)';
    return 'var(--surface2)';
  }

  matchLeftBorder(ex: Ejercicio, left: string): string {
    if (this.submitted()) {
      const r = this.pairResult(ex, left);
      if (r === 'correct') return 'var(--green)';
      if (r === 'wrong') return 'var(--error)';
    }
    if (this.matchPickedLeft() === left) return 'var(--blue)';
    if (this.currentState().matches[left]) return 'var(--green)';
    return 'var(--border)';
  }

  matchLeftColor(ex: Ejercicio, left: string): string {
    if (this.submitted()) {
      const r = this.pairResult(ex, left);
      if (r === 'correct') return 'var(--green)';
      if (r === 'wrong') return 'var(--error)';
    }
    if (this.matchPickedLeft() === left) return 'var(--blue)';
    if (this.currentState().matches[left]) return 'var(--green)';
    return 'var(--text2)';
  }

  isRightMatched(right: string): boolean {
    return Object.values(this.currentState().matches).includes(right);
  }

  private rightPairResult(ex: Ejercicio, right: string): 'correct' | 'wrong' | 'none' {
    const left = Object.entries(this.currentState().matches).find(([, r]) => r === right)?.[0];
    if (!left) return 'none';
    if (!this.submitted()) return 'none';
    const pairs = ex.respuestaCorrecta as readonly string[];
    const correctRight = pairs.find((p) => p.split('||')[0] === left)?.split('||')[1];
    return right === correctRight ? 'correct' : 'wrong';
  }

  matchRightBg(ex: Ejercicio, right: string): string {
    if (this.submitted()) {
      const r = this.rightPairResult(ex, right);
      if (r === 'correct') return 'var(--green-bg)';
      if (r === 'wrong') return 'var(--error-bg)';
    }
    if (this.isRightMatched(right)) return 'var(--surface3)';
    return 'var(--surface2)';
  }

  matchRightBorder(ex: Ejercicio, right: string): string {
    if (this.submitted()) {
      const r = this.rightPairResult(ex, right);
      if (r === 'correct') return 'var(--green)';
      if (r === 'wrong') return 'var(--error)';
    }
    if (this.isRightMatched(right)) return 'var(--green)';
    return 'var(--border)';
  }

  matchRightColor(ex: Ejercicio, right: string): string {
    if (this.submitted()) {
      const r = this.rightPairResult(ex, right);
      if (r === 'correct') return 'var(--green)';
      if (r === 'wrong') return 'var(--error)';
    }
    if (this.isRightMatched(right)) return 'var(--green)';
    return 'var(--text2)';
  }

  matchProgress(ex: Ejercicio): number {
    return ex.opciones.length ? (this.matchedCount() / ex.opciones.length) * 100 : 0;
  }

  // ── construirComando style helpers ────────────────────────────────────────

  isTokenUsed(idx: number): boolean {
    return this.currentState().tokenIndices.includes(idx);
  }

  private commandTokenStatus(idx: number): 'correct' | 'wrong' | 'pending' {
    const ex = this.current();
    if (!ex || ex.tipo !== 'construirComando' || !this.submitted()) return 'pending';
    const correct = Array.isArray(ex.respuestaCorrecta) ? ex.respuestaCorrecta as readonly string[] : [];
    const indices = this.currentState().tokenIndices;
    const positionInBuilt = indices.indexOf(idx);
    if (positionInBuilt === -1) return 'pending';
    return ex.opciones[idx] === correct[positionInBuilt] ? 'correct' : 'wrong';
  }

  commandTokenBg(idx: number): string {
    const status = this.commandTokenStatus(idx);
    if (status === 'correct') return 'var(--green-bg)';
    if (status === 'wrong') return 'var(--error-bg)';
    return 'var(--blue-bg)';
  }

  commandTokenBorder(idx: number): string {
    const status = this.commandTokenStatus(idx);
    if (status === 'correct') return 'var(--green)';
    if (status === 'wrong') return 'var(--error)';
    return 'var(--blue)';
  }

  commandTokenColor(idx: number): string {
    const status = this.commandTokenStatus(idx);
    if (status === 'correct') return 'var(--green)';
    if (status === 'wrong') return 'var(--error)';
    return 'var(--blue)';
  }

  // ── detectarError style helpers ───────────────────────────────────────────

  isLineFlagged(idx: number): boolean {
    return this.currentState().flaggedLines.includes(String(idx));
  }

  private isLineCorrect(idx: number): boolean {
    const ex = this.current();
    if (!ex || ex.tipo !== 'detectarError') return false;
    const correct = Array.isArray(ex.respuestaCorrecta) ? ex.respuestaCorrecta as readonly string[] : [];
    return correct.map(String).includes(String(idx));
  }

  errorLineResult(idx: number): 'correctFlag' | 'wrongFlag' | 'missed' | 'ok' {
    if (!this.submitted()) return 'ok';
    const flagged = this.isLineFlagged(idx);
    const isError = this.isLineCorrect(idx);
    if (flagged && isError) return 'correctFlag';
    if (flagged && !isError) return 'wrongFlag';
    if (!flagged && isError) return 'missed';
    return 'ok';
  }

  errorLineBg(idx: number): string {
    if (!this.submitted()) return this.isLineFlagged(idx) ? 'rgba(239,68,68,0.12)' : 'transparent';
    const r = this.errorLineResult(idx);
    if (r === 'correctFlag') return 'rgba(46,204,113,0.12)';
    if (r === 'wrongFlag') return 'rgba(239,68,68,0.12)';
    if (r === 'missed') return 'rgba(245,158,11,0.12)';
    return 'transparent';
  }

  errorLineBorder(idx: number): string {
    if (!this.submitted()) return this.isLineFlagged(idx) ? 'var(--error)' : 'transparent';
    const r = this.errorLineResult(idx);
    if (r === 'correctFlag') return 'var(--green)';
    if (r === 'wrongFlag') return 'var(--error)';
    if (r === 'missed') return 'var(--orange)';
    return 'transparent';
  }

  errorLineColor(idx: number): string {
    if (!this.submitted()) return this.isLineFlagged(idx) ? '#fca5a5' : '#e6e8eb';
    const r = this.errorLineResult(idx);
    if (r === 'correctFlag') return '#86efac';
    if (r === 'wrongFlag') return '#fca5a5';
    if (r === 'missed') return '#fcd34d';
    return '#9ca3af';
  }

  correctErrorLineLabels(ex: Ejercicio): string {
    if (!Array.isArray(ex.respuestaCorrecta)) return '';
    return (ex.respuestaCorrecta as readonly string[])
      .map((s) => `línea ${Number(s) + 1}`)
      .join(', ');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  select(option: string): void {
    if (this.submitted()) return;
    this.patchState({ selected: option });
  }

  onTextInput(event: Event): void {
    if (this.submitted()) return;
    this.patchState({ selected: (event.target as HTMLInputElement).value });
  }

  swapItems(idx: number): void {
    if (this.submitted()) return;
    const picked = this.swapPickedIdx();
    if (picked === null) { this.swapPickedIdx.set(idx); return; }
    if (picked === idx)  { this.swapPickedIdx.set(null); return; }
    const order = [...this.currentOrder()];
    [order[picked], order[idx]] = [order[idx], order[picked]];
    this.swapPickedIdx.set(null);
    this.patchState({ order });
  }

  matchLeft(left: string): void {
    if (this.submitted()) return;
    const state = this.currentState();
    if (state.matches[left]) {
      // un-match: remove pair so user can redo
      const newMatches = { ...state.matches };
      delete newMatches[left];
      this.patchState({ matches: newMatches });
      this.matchPickedLeft.set(null);
      return;
    }
    this.matchPickedLeft.set(left);
  }

  matchRight(right: string): void {
    if (this.submitted() || this.isRightMatched(right)) return;
    const picked = this.matchPickedLeft();
    if (!picked) return;
    this.patchState({ matches: { ...this.currentState().matches, [picked]: right } });
    this.matchPickedLeft.set(null);
  }

  addToken(idx: number): void {
    if (this.submitted()) return;
    if (this.isTokenUsed(idx)) return;
    this.patchState({ tokenIndices: [...this.currentState().tokenIndices, idx] });
  }

  removeToken(idx: number): void {
    if (this.submitted()) return;
    this.patchState({ tokenIndices: this.currentState().tokenIndices.filter((i) => i !== idx) });
  }

  toggleErrorLine(idx: number): void {
    if (this.submitted()) return;
    const key = String(idx);
    const lines = this.currentState().flaggedLines;
    const next = lines.includes(key) ? lines.filter((l) => l !== key) : [...lines, key];
    this.patchState({ flaggedLines: next });
  }

  submit(): void {
    if (!this.canSubmit() || this.submitted()) return;
    const ex = this.current();
    if (!ex) return;
    const extra: Partial<ExerciseAnswerState> = {};
    if (ex.tipo === 'arrastrarSoltar') extra.order = this.currentOrder();
    this.patchState({ submitted: true, ...extra });
  }

  next(): void {
    if (!this.submitted()) return;
    const total = this.exercises().length;
    if (this.currentIndex() === total - 1) { this.finishLesson(); return; }
    this.currentIndex.update((i) => i + 1);
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private patchState(patch: Partial<ExerciseAnswerState>): void {
    const idx = this.currentIndex();
    this.exerciseStates.update((s) => ({
      ...s,
      [idx]: { ...(s[idx] ?? DEFAULT_EXERCISE_STATE), ...patch },
    }));
  }

  private finishLesson(): void {
    const les = this.lesson();
    if (!les || this.finishing()) return;

    const exercises = this.exercises();
    const states = this.exerciseStates();
    const total = exercises.length;
    const aciertos = exercises.reduce((acc, ex, i) => {
      const state = states[i] ?? DEFAULT_EXERCISE_STATE;
      return acc + (isExerciseCorrect(ex, state) ? 1 : 0);
    }, 0);

    this.finishing.set(true);
    this.progresoService
      .registrarCompletado(les._id, aciertos, total)
      .pipe(
        switchMap((result) =>
          this.authService.refreshUser().pipe(map(() => result), catchError(() => of(result))),
        ),
        catchError(() => of(null)),
      )
      .subscribe((result) => {
        this.finishing.set(false);
        if (result) {
          this.progresoService.refresh();
          this.finishResult.set(result);
        } else { void this.router.navigate(['/app/lecciones']); }
      });
  }
}
