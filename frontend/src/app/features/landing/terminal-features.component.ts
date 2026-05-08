import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';

interface TermLine {
  type: 'section' | 'key' | 'ok';
  text: string;
  val?: string;
}

interface TermSeq {
  cmd: string;
  lines: TermLine[];
}

const SEQUENCES: TermSeq[] = [
  {
    cmd: 'gitlearn path --show',
    lines: [
      { type: 'section', text: 'RUTA DE APRENDIZAJE' },
      { type: 'key',     text: 'niveles',    val: 'básico → intermedio → avanzado → experto' },
      { type: 'key',     text: 'lecciones',  val: '12 lecciones progresivas desbloqueables' },
      { type: 'key',     text: 'requisitos', val: 'completa el nivel anterior para avanzar' },
      { type: 'ok',      text: 'Cada lección desbloquea la siguiente. Sin saltar pasos.' },
    ],
  },
  {
    cmd: 'gitlearn xp --status',
    lines: [
      { type: 'section', text: 'SISTEMA DE XP Y RACHAS' },
      { type: 'key',     text: 'xpTotal', val: 'se acumula con cada ejercicio completado' },
      { type: 'key',     text: 'racha',   val: 'días consecutivos de práctica activa' },
      { type: 'key',     text: 'niveles', val: 'sube de nivel cada 100 XP ganados' },
      { type: 'ok',      text: 'Mantén tu racha. La constancia es la clave.' },
    ],
  },
  {
    cmd: 'gitlearn badges --list',
    lines: [
      { type: 'section', text: 'INSIGNIAS Y LOGROS' },
      { type: 'key',     text: 'primera_leccion', val: 'completa tu primer ejercicio' },
      { type: 'key',     text: 'nivel_basico',    val: 'termina todas las lecciones básicas' },
      { type: 'key',     text: 'racha_7',         val: '7 días consecutivos de práctica' },
      { type: 'ok',      text: '8 insignias únicas desbloqueables. ¿Puedes conseguirlas todas?' },
    ],
  },
  {
    cmd: 'gitlearn exercises --types',
    lines: [
      { type: 'section', text: 'TIPOS DE EJERCICIOS' },
      { type: 'key',     text: 'opcionMultiple', val: 'elige la respuesta correcta entre 4 opciones' },
      { type: 'key',     text: 'rellenarHuecos', val: 'completa el comando con la palabra exacta' },
      { type: 'key',     text: 'explicacion',    val: 'feedback detallado tras cada respuesta' },
      { type: 'ok',      text: 'Aprende haciendo, no memorizando.' },
    ],
  },
];

@Component({
  selector: 'app-terminal-features',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    @keyframes termLine { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
    @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
    .term-cursor { display:inline-block;width:8px;height:14px;background:#58CC02;border-radius:1px;vertical-align:middle;animation:blink 1s step-end infinite;margin-left:2px; }
    .term-line { animation: termLine 0.18s ease forwards; }
    .term-tab { cursor:pointer; transition:all 0.2s; }
    .term-tab:hover { opacity:1 !important; }
  `],
  template: `
    <section style="max-width:900px;margin:0 auto;padding:0 32px 80px">
      <div style="text-align:center;margin-bottom:36px">
        <h2 style="font-size:28px;font-weight:800;letter-spacing:-0.02em;margin-bottom:8px;color:var(--text)">
          Todo lo que necesitas para dominar Git
        </h2>
        <p style="font-size:15px;color:var(--muted)">Una herramienta, cuatro superpoderes.</p>
      </div>

      <!-- Terminal window -->
      <div style="background:#0d1117;border:1.5px solid #21262d;border-radius:var(--r-2xl);overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.6)">

        <!-- Title bar -->
        <div style="background:#161b22;border-bottom:1px solid #21262d;padding:12px 18px;display:flex;align-items:center;gap:12px">
          <div style="display:flex;gap:6px">
            <div style="width:12px;height:12px;border-radius:50%;background:#FF5F57"></div>
            <div style="width:12px;height:12px;border-radius:50%;background:#FFBD2E"></div>
            <div style="width:12px;height:12px;border-radius:50%;background:#28CA42"></div>
          </div>
          <div style="flex:1;text-align:center">
            <span style="font-size:12px;color:#8b949e;font-family:monospace;font-weight:600">gitlearn — bash — 80×24</span>
          </div>
          <img src="logoGitLearn.png" alt="" style="width:18px;height:18px;object-fit:contain;opacity:0.7">
        </div>

        <!-- Body -->
        <div #termRef style="padding:24px 28px;font-family:'SF Mono','Fira Code','Fira Mono','Roboto Mono',monospace;font-size:13px;line-height:1.7;overflow-y:auto;scroll-behavior:smooth"
             [style.min-height]="'340px'"
             [style.max-height]="isDone() ? '460px' : '340px'"
             [style.transition]="'max-height 0.5s ease'">

          <!-- Completed history -->
          @for (block of history(); track block.idx) {
            <div style="margin-bottom:20px;padding:4px 6px;border-radius:6px;transition:outline 0.2s"
                 [style.outline]="isDone() && activeTab() === block.idx ? '1.5px solid rgba(88,204,2,0.35)' : '1.5px solid transparent'">
              <div style="margin-bottom:6px">
                <span style="color:#7C3AED;font-weight:700">❯</span>
                <span style="color:#8b949e"> gitlearn </span>
                <span style="color:#F8FAFC">{{ block.cmd.replace('gitlearn ', '') }}</span>
              </div>
              @for (line of block.lines; track $index) {
                <div class="term-line" style="line-height:1.75">
                  @if (line.type === 'section') {
                    <span style="color:#58CC02;font-weight:700">
                      &nbsp;&nbsp;<span style="background:rgba(88,204,2,0.12);border:1px solid rgba(88,204,2,0.25);border-radius:4px;padding:1px 8px">{{ line.text }}</span>
                    </span>
                  }
                  @if (line.type === 'key') {
                    <span>
                      &nbsp;&nbsp;<span style="color:#7C3AED;font-weight:600">{{ line.text }}</span>
                      <span style="color:#334155"> = </span>
                      <span style="color:#F8FAFC">{{ line.val }}</span>
                    </span>
                  }
                  @if (line.type === 'ok') {
                    <span>
                      &nbsp;&nbsp;<span style="color:#58CC02;font-weight:700">✓</span>
                      <span style="color:#3B82F6"> {{ line.text }}</span>
                    </span>
                  }
                </div>
              }
            </div>
          }

          <!-- Active block -->
          @if (!isDone()) {
            <div>
              @if (cmdText().length > 0) {
                <div style="margin-bottom:6px">
                  <span style="color:#7C3AED;font-weight:700">❯</span>
                  <span style="color:#8b949e"> gitlearn </span>
                  <span style="color:#F8FAFC">{{ cmdText().replace('gitlearn ', '') }}</span>
                  @if (typingPhase()) {
                    <span class="term-cursor"></span>
                  }
                </div>
              }
              @if (visLines().length > 0) {
                <div style="margin-bottom:8px">
                  @for (line of visLines(); track $index) {
                    <div class="term-line" style="line-height:1.75">
                      @if (line.type === 'section') {
                        <span style="color:#58CC02;font-weight:700">
                          &nbsp;&nbsp;<span style="background:rgba(88,204,2,0.12);border:1px solid rgba(88,204,2,0.25);border-radius:4px;padding:1px 8px">{{ line.text }}</span>
                        </span>
                      }
                      @if (line.type === 'key') {
                        <span>
                          &nbsp;&nbsp;<span style="color:#7C3AED;font-weight:600">{{ line.text }}</span>
                          <span style="color:#334155"> = </span>
                          <span style="color:#F8FAFC">{{ line.val }}</span>
                        </span>
                      }
                      @if (line.type === 'ok') {
                        <span>
                          &nbsp;&nbsp;<span style="color:#58CC02;font-weight:700">✓</span>
                          <span style="color:#3B82F6"> {{ line.text }}</span>
                        </span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- Done: idle cursor -->
          @if (isDone()) {
            <div style="margin-top:4px;animation:termLine 0.3s ease">
              <span style="color:#7C3AED;font-weight:700">❯</span>
              <span class="term-cursor"></span>
            </div>
          }
        </div>

        <!-- Bottom nav tabs -->
        <div style="background:#161b22;border-top:1px solid #21262d;padding:10px 18px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          @for (seq of sequences; track $index; let i = $index) {
            <button class="term-tab"
                    (click)="isDone() && handleTab(i)"
                    [style.background]="isDone() && activeTab() === i ? 'rgba(88,204,2,0.12)' : 'transparent'"
                    [style.border]="'1px solid ' + (isDone() && activeTab() === i ? 'rgba(88,204,2,0.3)' : 'transparent')"
                    [style.opacity]="isBlockComplete(i) ? (isDone() && activeTab() === i ? '1' : '0.65') : '0.25'"
                    [style.cursor]="isDone() ? 'pointer' : 'default'"
                    style="display:flex;align-items:center;gap:7px;border-radius:6px;padding:4px 10px;transition:all 0.2s">
              <div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;transition:background 0.3s"
                   [style.background]="isBlockComplete(i) ? '#58CC02' : '#334155'"></div>
              <span style="font-size:11px;font-family:monospace;white-space:nowrap"
                    [style.color]="isDone() && activeTab() === i ? '#58CC02' : '#8b949e'"
                    [style.font-weight]="isDone() && activeTab() === i ? '700' : '400'">
                {{ seq.cmd.split(' ')[1] }}
              </span>
            </button>
          }
          <div style="margin-left:auto;font-size:11px;color:#334155;font-family:monospace">
            {{ isDone() ? 'listo · haz clic en una sección' : (seqIdx() + 1) + '/' + sequences.length }}
          </div>
        </div>
      </div>
    </section>
  `,
})
export class TerminalFeaturesComponent implements OnInit, OnDestroy {
  @ViewChild('termRef') termRef!: ElementRef<HTMLDivElement>;

  readonly sequences = SEQUENCES;
  readonly cmdText = signal('');
  readonly visLines = signal<TermLine[]>([]);
  readonly seqIdx = signal(0);
  readonly typingPhase = signal(true);
  readonly isDone = signal(false);
  readonly history = signal<Array<{ cmd: string; lines: TermLine[]; idx: number }>>([]);
  readonly activeTab = signal<number | null>(null);

  private timers: ReturnType<typeof setTimeout>[] = [];

  isBlockComplete(i: number): boolean {
    return this.history().some((h) => h.idx === i) || this.isDone();
  }

  handleTab(i: number): void {
    this.activeTab.set(i);
  }

  ngOnInit(): void {
    this.runTyping();
  }

  private tick(fn: () => void, delay: number): void {
    this.timers.push(setTimeout(fn, delay));
  }

  private runTyping(): void {
    const seq = SEQUENCES[this.seqIdx()];
    const current = this.cmdText();

    if (current.length < seq.cmd.length) {
      this.tick(() => {
        this.cmdText.set(seq.cmd.slice(0, current.length + 1));
        this.runTyping();
      }, 42);
    } else {
      this.tick(() => {
        this.typingPhase.set(false);
        this.visLines.set([]);
        this.runRevealing();
      }, 280);
    }
  }

  private runRevealing(): void {
    const seq = SEQUENCES[this.seqIdx()];
    const current = this.visLines();

    if (current.length < seq.lines.length) {
      this.tick(() => {
        this.visLines.update((v) => [...v, seq.lines[v.length]]);
        if (this.termRef?.nativeElement) {
          this.termRef.nativeElement.scrollTop = this.termRef.nativeElement.scrollHeight;
        }
        this.runRevealing();
      }, 140);
    } else {
      const isLast = this.seqIdx() === SEQUENCES.length - 1;
      this.tick(() => {
        const s = this.seqIdx();
        this.history.update((h) => [...h, { cmd: seq.cmd, lines: seq.lines, idx: s }]);

        if (isLast) {
          this.isDone.set(true);
          this.activeTab.set(0);
        } else {
          this.seqIdx.update((i) => i + 1);
          this.cmdText.set('');
          this.visLines.set([]);
          this.typingPhase.set(true);
          this.runTyping();
        }
      }, isLast ? 600 : 900);
    }
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }
}
