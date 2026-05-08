import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-hero-animation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
  styles: [`
    @keyframes xpPop {
      0%   { opacity:0; transform:translateY(0) scale(0.7); }
      30%  { opacity:1; transform:translateY(-24px) scale(1.15); }
      70%  { opacity:1; transform:translateY(-32px) scale(1); }
      100% { opacity:0; transform:translateY(-48px) scale(0.9); }
    }
    @keyframes nodeUnlock {
      0%   { transform:scale(0.7); opacity:0; }
      60%  { transform:scale(1.2); opacity:1; }
      100% { transform:scale(1);  opacity:1; }
    }
    @keyframes fadeSlideUp {
      from { opacity:0; transform:translateY(12px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes pulseGreen {
      0%,100% { box-shadow: 0 0 0 0 rgba(88,204,2,0.4); }
      50%      { box-shadow: 0 0 0 8px rgba(88,204,2,0); }
    }
    .hero-card  { animation: fadeSlideUp 0.5s ease; }
    .node-unlock { animation: nodeUnlock 0.5s cubic-bezier(.34,1.56,.64,1) forwards; }
    .xp-pop { animation: xpPop 1.2s ease forwards; }
    .fade-slide { animation: fadeSlideUp 0.3s ease; }
    .progress-fill { transition: width 0.8s cubic-bezier(.34,1.56,.64,1); }
    .option-row { transition: all 0.3s; }
  `],
  template: `
    <div style="position:relative;width:100%;max-width:440px">

      <!-- Main card -->
      <div style="background:var(--surface);border:1.5px solid var(--border);border-radius:var(--r-2xl);overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.5)">

        <!-- Top bar -->
        <div style="background:var(--surface2);padding:12px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:8px">
            <img src="logoGitLearn.png" alt="" style="width:24px;height:24px;object-fit:contain">
            <span style="font-size:13px;font-weight:800;color:var(--text)">GitLearn</span>
          </div>
          <div style="display:flex;gap:10px">
            <div style="display:flex;align-items:center;gap:4px;background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:var(--r-full);padding:3px 10px;font-size:12px;font-weight:700;color:var(--gold);transition:all 0.4s">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              {{ xp() }} XP
            </div>
            <div style="display:flex;align-items:center;gap:4px;background:var(--orange-bg);border:1px solid var(--orange-border);border-radius:var(--r-full);padding:3px 10px;font-size:12px;font-weight:700;color:var(--orange)">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
              5
            </div>
          </div>
        </div>

        <!-- Lesson path -->
        <div style="padding:16px 18px 12px;border-bottom:1px solid var(--border)">
          <div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:12px">Ruta · Básico</div>
          <div style="display:flex;gap:0;align-items:center">
            @for (node of nodes(); track $index; let i = $index) {
              <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                <div [ngClass]="{'node-unlock': node && i === 2 && phase() >= 3}"
                     [style.border]="'2.5px solid ' + (node ? 'var(--green)' : i === completedCount() ? 'var(--blue)' : 'var(--border)')"
                     [style.background]="node ? 'var(--green-bg)' : 'var(--surface2)'"
                     style="width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.4s">
                  @if (node) {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  } @else if (i === completedCount()) {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  } @else {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  }
                </div>
                <span style="font-size:9px;font-weight:600;text-align:center;max-width:56px;line-height:1.2"
                      [style.color]="node ? 'var(--green)' : 'var(--muted)'">{{ nodeLabels[i] }}</span>
              </div>
              @if (i < 3) {
                <div style="flex:1;height:2.5px;border-radius:2px;margin-bottom:20px;transition:background 0.5s"
                     [style.background]="nodes()[i] ? 'var(--green)' : 'var(--border)'"></div>
              }
            }
          </div>
        </div>

        <!-- Exercise area -->
        <div style="padding:18px;position:relative;min-height:220px">
          <!-- Progress bar -->
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
            <div style="flex:1;height:6px;background:var(--surface3);border-radius:var(--r-full);overflow:hidden">
              <div class="progress-fill" [style.width]="progress() + '%'"
                   style="height:100%;background:var(--green);border-radius:var(--r-full)"></div>
            </div>
            <span style="font-size:11px;color:var(--muted);font-weight:700">2/4</span>
          </div>

          <!-- Question -->
          <p style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px;line-height:1.5">¿Qué comando crea una nueva rama en Git?</p>

          <!-- Options -->
          <div style="display:flex;flex-direction:column;gap:7px">
            @for (opt of opts; track $index; let i = $index) {
              <div class="option-row"
                   [style.background]="getOptBg(i)"
                   [style.border]="'1.5px solid ' + getOptBorder(i)"
                   [style.color]="getOptColor(i)"
                   style="padding:9px 13px;border-radius:var(--r-lg);font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px">
                <span style="width:20px;height:20px;border-radius:50%;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:var(--muted);flex-shrink:0">{{ letters[i] }}</span>
                {{ opt }}
                @if (phase() >= 2 && i === 1) {
                  <svg style="margin-left:auto" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                }
              </div>
            }
          </div>

          <!-- Feedback -->
          @if (phase() === 2) {
            <div class="fade-slide" style="margin-top:10px;padding:8px 12px;background:var(--green-bg);border:1px solid var(--green-border);border-radius:var(--r-md);font-size:12px;font-weight:700;color:var(--green)">
              ¡Correcto! git branch crea una nueva rama.
            </div>
          }

          <!-- XP pop -->
          @if (showXpPop()) {
            <div class="xp-pop" style="position:absolute;top:24px;right:24px;background:var(--gold);color:#0a1a00;font-weight:900;font-size:15px;padding:6px 14px;border-radius:var(--r-full);pointer-events:none;z-index:10">
              +60 XP
            </div>
          }
        </div>
      </div>

      <!-- Floating badge -->
      <div style="position:absolute;bottom:-16px;right:-16px;background:var(--surface2);border:1.5px solid var(--gold-border);border-radius:var(--r-xl);padding:10px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 24px rgba(0,0,0,0.4)">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--gold-bg);border:1.5px solid var(--gold-border);display:flex;align-items:center;justify-content:center">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--gold)">Nivel Básico</div>
          <div style="font-size:10px;color:var(--muted)">Insignia desbloqueada</div>
        </div>
      </div>
    </div>
  `,
})
export class HeroAnimationComponent implements OnInit, OnDestroy {
  readonly phase = signal(0);
  readonly xp = signal(180);
  readonly progress = signal(40);
  readonly showXpPop = signal(false);
  readonly nodes = signal([true, true, false, false]);
  readonly selectedOpt = signal<number | null>(null);

  readonly opts = ['git merge', 'git branch', 'git pull', 'git clone'];
  readonly letters = ['A', 'B', 'C', 'D'];
  readonly nodeLabels = ['Intro a Git', 'Commits', 'Ramas y Merges', 'Git Remoto'];

  private readonly PHASES = [2000, 1200, 1600, 1800];
  private timers: ReturnType<typeof setTimeout>[] = [];

  readonly completedCount = computed(() => this.nodes().filter(Boolean).length);

  getOptBg(i: number): string {
    const p = this.phase();
    const sel = this.selectedOpt();
    if (p >= 2 && i === 1) return 'var(--green-bg)';
    if (p >= 2 && i === sel && i !== 1) return 'var(--error-bg)';
    if (p >= 1 && i === sel) return 'var(--blue-bg)';
    return 'var(--surface2)';
  }

  getOptBorder(i: number): string {
    const p = this.phase();
    const sel = this.selectedOpt();
    if (p >= 2 && i === 1) return 'var(--green)';
    if (p >= 2 && i === sel && i !== 1) return 'var(--error)';
    if (p >= 1 && i === sel) return 'var(--blue)';
    return 'var(--border)';
  }

  getOptColor(i: number): string {
    const p = this.phase();
    const sel = this.selectedOpt();
    if (p >= 2 && i === 1) return 'var(--green)';
    if (p >= 2 && i === sel && i !== 1) return 'var(--error)';
    if (p >= 1 && i === sel) return 'var(--text)';
    return 'var(--text2)';
  }

  ngOnInit(): void {
    this.runPhase(0);
  }

  private runPhase(p: number): void {
    const t = setTimeout(() => {
      const next = (p + 1) % 4;
      this.phase.set(next);

      if (next === 1) this.selectedOpt.set(1);
      if (next === 2) {
        this.showXpPop.set(true);
        const hideT = setTimeout(() => this.showXpPop.set(false), 1200);
        this.timers.push(hideT);
      }
      if (next === 3) {
        this.xp.update((x) => x + 60);
        this.progress.update((v) => Math.min(v + 18, 96));
        this.nodes.update((n) => { const c = [...n]; c[2] = true; return c; });
      }
      if (next === 0) {
        this.selectedOpt.set(null);
        this.nodes.set([true, true, false, false]);
        this.xp.set(180);
        this.progress.set(40);
      }

      this.runPhase(next);
    }, this.PHASES[p]);

    this.timers.push(t);
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }
}
