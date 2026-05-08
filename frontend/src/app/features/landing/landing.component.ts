import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeroAnimationComponent } from './hero-animation.component';
import { TerminalFeaturesComponent } from './terminal-features.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HeroAnimationComponent, TerminalFeaturesComponent],
  template: `
    <div style="min-height:100vh;background:var(--bg)">

      <!-- Navbar -->
      <header style="height:64px;display:flex;align-items:center;padding:0 32px;border-bottom:1.5px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:10">
        <div style="display:flex;align-items:center;gap:8px;flex:1">
          <img src="logoGitLearn.png" alt="GitLearn" style="width:36px;height:36px;object-fit:contain">
          <span style="font-size:17px;font-weight:800;letter-spacing:-0.02em;color:var(--text)">GitLearn</span>
        </div>
        <div style="display:flex;gap:10px">
          <a routerLink="/login" class="gl-btn gl-btn-sm gl-btn-secondary">Iniciar sesión</a>
          <a routerLink="/register" class="gl-btn gl-btn-sm gl-btn-primary">Empezar gratis</a>
        </div>
      </header>

      <!-- Hero — full viewport -->
      <section style="min-height:calc(100vh - 64px);display:flex;align-items:center;padding:60px 32px;max-width:1200px;margin:0 auto">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;width:100%">

          <!-- Left -->
          <div>
            <div style="display:inline-flex;align-items:center;gap:8px;background:var(--green-bg);border:1px solid var(--green-border);border-radius:var(--r-full);padding:6px 16px;margin-bottom:28px;font-size:13px;font-weight:600;color:var(--green)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              La forma más efectiva de dominar Git
            </div>

            <h1 style="font-size:clamp(36px,5vw,64px);font-weight:900;line-height:1.08;letter-spacing:-0.035em;margin-bottom:24px;color:var(--text)">
              Aprende Git como<br>
              <span style="color:var(--green)">un profesional</span>
            </h1>

            <p style="font-size:18px;color:var(--text2);margin-bottom:40px;line-height:1.7;max-width:480px">
              Lecciones interactivas, progreso gamificado y ejercicios prácticos. Desde los primeros commits hasta flujos de trabajo avanzados.
            </p>

            <div style="display:flex;gap:14px;flex-wrap:wrap">
              <a routerLink="/register" class="gl-btn gl-btn-lg gl-btn-primary" style="min-width:200px">
                Empezar gratis
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a1a00" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
              </a>
              <a routerLink="/login" class="gl-btn gl-btn-lg gl-btn-secondary">
                Iniciar sesión
              </a>
            </div>

            <!-- Social proof -->
            <div style="display:flex;align-items:center;gap:16px;margin-top:36px">
              <div style="display:flex">
                <div style="width:32px;height:32px;border-radius:50%;background:oklch(0.45 0.12 120);border:2px solid var(--bg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff">A</div>
                <div style="width:32px;height:32px;border-radius:50%;background:oklch(0.45 0.12 180);border:2px solid var(--bg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;margin-left:-8px">B</div>
                <div style="width:32px;height:32px;border-radius:50%;background:oklch(0.45 0.12 240);border:2px solid var(--bg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;margin-left:-8px">C</div>
                <div style="width:32px;height:32px;border-radius:50%;background:oklch(0.45 0.12 300);border:2px solid var(--bg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;margin-left:-8px">D</div>
              </div>
              <div>
                <div style="font-size:13px;font-weight:700;color:var(--text)">+2,400 estudiantes</div>
                <div style="font-size:12px;color:var(--muted)">ya están dominando Git</div>
              </div>
            </div>
          </div>

          <!-- Right — Hero animation -->
          <div style="display:flex;justify-content:center;padding-bottom:32px">
            <app-hero-animation />
          </div>
        </div>
      </section>

      <!-- Terminal Features -->
      <app-terminal-features />

      <!-- Footer CTA -->
      <section style="background:var(--surface);border-top:1.5px solid var(--border);padding:56px 32px;text-align:center">
        <h2 style="font-size:28px;font-weight:800;margin-bottom:12px;color:var(--text)">Empieza hoy, gratis</h2>
        <p style="color:var(--text2);margin-bottom:28px">Sin tarjeta de crédito. Sin compromisos.</p>
        <a routerLink="/register" class="gl-btn gl-btn-lg gl-btn-primary">
          Crear cuenta gratis
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a1a00" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
        </a>
      </section>

    </div>
  `,
})
export class LandingComponent {}
