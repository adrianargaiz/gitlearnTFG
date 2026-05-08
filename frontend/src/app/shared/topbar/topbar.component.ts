import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
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
  `],
  template: `
    <header class="gl-topbar">
      <div style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;height:100%;gap:0">

        <!-- Logo -->
        <a [routerLink]="homePath()" style="display:flex;align-items:center;gap:8px;text-decoration:none;flex-shrink:0;margin-right:24px">
          <img src="logoGitLearn.png" alt="" style="width:28px;height:28px;object-fit:contain" aria-hidden="true">
          <span style="font-weight:800;font-size:14px;color:var(--text);letter-spacing:-0.01em">GitLearn</span>
        </a>

        <!-- Nav links -->
        <nav style="display:flex;align-items:center;gap:2px;flex:1">
          @for (item of navItems(); track item.path) {
            <a [routerLink]="item.path"
               routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: false }"
               class="nav-link"
               style="position:relative">
              {{ item.label }}
              @if (item.badge && item.badge > 0) {
                <span style="
                  position:absolute;top:-4px;right:-4px;
                  min-width:16px;height:16px;padding:0 4px;
                  background:var(--green);color:#fff;
                  font-size:10px;font-weight:800;
                  border-radius:8px;display:flex;align-items:center;justify-content:center;
                  line-height:1">{{ item.badge > 9 ? '9+' : item.badge }}</span>
              }
            </a>
          }
        </nav>

        <!-- Right side -->
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
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

            <!-- Divider -->
            <div style="width:1px;height:20px;background:var(--border);margin:0 4px"></div>

            <!-- Avatar + name -->
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;background:var(--green-bg);border:1.5px solid var(--green-border);color:var(--green)">
                {{ initials(u.nombre) }}
              </div>
              <span style="font-size:13px;font-weight:600;color:var(--text2);max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ u.nombre.split(' ')[0] }}</span>
            </div>

            <!-- Logout -->
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
      </div>
    </header>
  `,
})
export class TopbarComponent {
  private readonly authService = inject(AuthService);
  private readonly asignacionService = inject(AsignacionService);

  readonly user = this.authService.currentUser;

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
