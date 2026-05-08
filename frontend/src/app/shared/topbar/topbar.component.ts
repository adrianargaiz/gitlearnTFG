import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, map, of, switchMap } from 'rxjs';
import { ROLE_HOME_PATH } from '../../core/constants/auth.constants';
import { AsignacionService } from '../../core/services/asignacion.service';
import { AuthService } from '../../core/services/auth.service';
import { getInitials } from '../utils/initials';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly badge?: number;
}

@Component({
  selector: 'app-topbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  styles: [`
    .nav-link {
      display: inline-flex; align-items: center; padding: 5px 10px;
      border-radius: var(--r-md); font-size: 13px; font-weight: 600;
      color: var(--text2); border: 1px solid transparent;
      transition: color 0.15s, background 0.15s, border-color 0.15s;
      text-decoration: none; white-space: nowrap;
    }
    .nav-link:hover { color: var(--text); background: var(--surface2); }
    .nav-link.active { color: var(--text); background: var(--surface2); border-color: var(--border); }

    .nav-link-mobile {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border-radius: var(--r-md);
      font-size: 15px; font-weight: 600; color: var(--text2);
      text-decoration: none; border: 1px solid transparent;
    }
    .nav-link-mobile.active { color: var(--text); background: var(--surface2); border-color: var(--border); }

    /* Hide desktop nav under 768px */
    @media (max-width: 767px) {
      .desktop-nav, .desktop-right { display: none !important; }
    }
    /* Hide hamburger on >= 768px */
    @media (min-width: 768px) {
      .mobile-toggle { display: none !important; }
    }
  `],
  template: `
    <header class="gl-topbar" style="position:relative">
      <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;height:100%;gap:0;width:100%">

        <!-- Logo -->
        <a [routerLink]="homePath()" style="display:flex;align-items:center;gap:8px;text-decoration:none;flex-shrink:0;margin-right:24px">
          <img src="logoGitLearn.png" alt="" style="width:28px;height:28px;object-fit:contain" aria-hidden="true">
          <span style="font-weight:800;font-size:14px;color:var(--text);letter-spacing:-0.01em">GitLearn</span>
        </a>

        <!-- Desktop nav (>= 768px) -->
        <nav class="desktop-nav" style="display:flex;align-items:center;gap:2px;flex:1">
          @for (item of navItems(); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: false }"
               class="nav-link"
               style="position:relative">
              {{ item.label }}
              @if (item.badge && item.badge > 0) {
                <span style="position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;padding:0 4px;background:var(--green);color:#fff;font-size:10px;font-weight:800;border-radius:8px;display:flex;align-items:center;justify-content:center;line-height:1">{{ item.badge > 9 ? '9+' : item.badge }}</span>
              }
            </a>
          }
        </nav>

        <!-- Desktop right side (>= 768px) -->
        <div class="desktop-right" style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          @if (user(); as u) {
            @if (u.rol === 'estudiante') {
              <span class="gl-badge gl-badge-gold" style="gap:4px;font-size:11px">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {{ u.xpTotal }} XP
              </span>
              <span class="gl-badge gl-badge-orange" style="gap:4px;font-size:11px">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
                {{ u.racha }}
              </span>
            }
            <div style="width:1px;height:20px;background:var(--border);margin:0 4px"></div>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;background:var(--green-bg);border:1.5px solid var(--green-border);color:var(--green)">
                {{ initials(u.nombre) }}
              </div>
              <span style="font-size:13px;font-weight:600;color:var(--text2);max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ u.nombre.split(' ')[0] }}</span>
            </div>
            <button type="button" (click)="logout()"
              class="gl-btn gl-btn-sm gl-btn-ghost"
              aria-label="Cerrar sesión"
              style="padding:5px 8px">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          }
        </div>

        <!-- Mobile spacer + hamburger -->
        <div style="flex:1"></div>
        <button type="button" class="mobile-toggle gl-btn gl-btn-sm gl-btn-ghost"
          (click)="toggleMenu()"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Abrir menú"
          style="padding:8px">
          @if (menuOpen()) {
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          } @else {
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          }
        </button>
      </div>

      <!-- Mobile drawer -->
      @if (menuOpen()) {
        <div style="position:absolute;top:100%;left:0;right:0;background:var(--surface);border-bottom:1.5px solid var(--border);box-shadow:0 8px 24px rgba(0,0,0,0.4);z-index:99;padding:14px;display:flex;flex-direction:column;gap:6px">
          @if (user(); as u) {
            <!-- User card -->
            <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r-lg);margin-bottom:8px">
              <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;background:var(--green-bg);border:1.5px solid var(--green-border);color:var(--green)">
                {{ initials(u.nombre) }}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:14px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ u.nombre }}</div>
                <div style="font-size:12px;color:var(--muted);text-transform:capitalize">{{ u.rol }}</div>
              </div>
              @if (u.rol === 'estudiante') {
                <div style="display:flex;flex-direction:column;gap:4px">
                  <span class="gl-badge gl-badge-gold" style="gap:4px;font-size:10px;padding:2px 6px">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    {{ u.xpTotal }} XP
                  </span>
                  <span class="gl-badge gl-badge-orange" style="gap:4px;font-size:10px;padding:2px 6px">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                    {{ u.racha }} días
                  </span>
                </div>
              }
            </div>
          }

          <!-- Nav items -->
          @for (item of navItems(); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: false }"
               class="nav-link-mobile"
               (click)="closeMenu()">
              <span>{{ item.label }}</span>
              @if (item.badge && item.badge > 0) {
                <span style="min-width:20px;height:20px;padding:0 6px;background:var(--green);color:#fff;font-size:11px;font-weight:800;border-radius:10px;display:inline-flex;align-items:center;justify-content:center">{{ item.badge > 9 ? '9+' : item.badge }}</span>
              }
            </a>
          }

          <!-- Logout -->
          @if (user()) {
            <button type="button" (click)="logout()"
              class="gl-btn gl-btn-md gl-btn-ghost"
              style="margin-top:8px;justify-content:flex-start;width:100%">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Cerrar sesión
            </button>
          }
        </div>
      }
    </header>
  `,
})
export class TopbarComponent {
  private readonly authService = inject(AuthService);
  private readonly asignacionService = inject(AsignacionService);
  private readonly router = inject(Router);

  readonly user = this.authService.currentUser;
  readonly menuOpen = signal(false);

  constructor() {
    // Cierra el drawer móvil al navegar
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.menuOpen.set(false));
  }

  toggleMenu(): void { this.menuOpen.update((v) => !v); }
  closeMenu(): void { this.menuOpen.set(false); }

  readonly homePath = computed(() => {
    const rol = this.user()?.rol;
    return rol ? ROLE_HOME_PATH[rol] : ROLE_HOME_PATH.estudiante;
  });

  private readonly tareasPendientes = toSignal(
    toObservable(computed(() => this.user()?.rol)).pipe(
      switchMap((rol) => {
        if (rol !== 'estudiante') return of(0);
        return this.asignacionService.getMisAsignaciones().pipe(
          map((list) => list.filter((a) => !a.completada).length),
          catchError(() => of(0))
        );
      })
    ),
    { initialValue: 0 }
  );

  readonly navItems = computed<readonly NavItem[]>(() => {
    const rol = this.user()?.rol;
    if (rol === 'profesor') {
      return [
        { label: 'Dashboard', path: '/profesor/dashboard' },
        { label: 'Mis lecciones', path: '/profesor/lecciones' },
      ];
    }
    if (rol === 'administrador') {
      return [
        { label: 'Dashboard', path: '/admin/dashboard' },
        { label: 'Usuarios', path: '/admin/usuarios' },
        { label: 'Contenido', path: '/admin/contenido' },
      ];
    }
    return [
      { label: 'Dashboard', path: '/app/dashboard' },
      { label: 'Lecciones', path: '/app/lecciones' },
      { label: 'Tareas', path: '/app/tareas', badge: this.tareasPendientes() },
      { label: 'Progreso', path: '/app/progreso' },
    ];
  });

  initials(name: string): string {
    return getInitials(name);
  }

  logout(): void {
    this.authService.logout();
  }
}
