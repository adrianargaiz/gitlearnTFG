import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { AdminService, AdminUser } from '../../../core/services/admin.service';
import { TopbarComponent } from '../../../shared/topbar/topbar.component';
import { formatShortDate } from '../../../shared/utils/format-date';
import { getInitials } from '../../../shared/utils/initials';

type RolFilter = 'todos' | AdminUser['rol'];

@Component({
  selector: 'app-user-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TopbarComponent],
  template: `
    <div class="min-h-screen" style="background:var(--bg)">
      <app-topbar />

      <main class="gl-main" style="max-width:1100px;margin:0 auto">
        <header style="margin-bottom:28px">
          <h1 class="gl-page-title">Gestión de usuarios</h1>
          <p class="gl-page-subtitle">{{ users().length }} usuarios registrados</p>
        </header>

        <!-- Filters row -->
        <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center">
          <div class="gl-tabs" role="tablist" aria-label="Filtrar por rol">
            @for (f of roleFilters; track f.value) {
              <button type="button" role="tab"
                [attr.aria-selected]="rolFilter() === f.value"
                (click)="rolFilter.set(f.value)"
                class="gl-tab" [class.active]="rolFilter() === f.value">
                {{ f.label }}
                <span style="margin-left:5px;font-size:11px;background:var(--surface3);border-radius:var(--r-full);padding:1px 7px;color:var(--muted)">{{ countByRole(f.value) }}</span>
              </button>
            }
          </div>
          <div style="position:relative;flex:1;max-width:260px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <label for="search" class="sr-only">Buscar usuario</label>
            <input id="search" type="search" [value]="query()" (input)="onQuery($event)"
              placeholder="Buscar por nombre o email..."
              class="gl-input" style="padding-left:36px;height:40px;font-size:14px"/>
          </div>
          <button type="button" (click)="onlyInactive.set(!onlyInactive())"
            class="gl-btn gl-btn-sm"
            [class]="onlyInactive() ? 'gl-btn-danger' : 'gl-btn-secondary'">
            @if (onlyInactive()) {
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            }
            Solo inactivos
          </button>
        </div>

        <!-- Table -->
        <div class="gl-card" style="padding:0;overflow:hidden">
          <div class="overflow-x-auto">
            <table class="gl-table">
              <thead>
                <tr>
                  <th scope="col">Usuario</th>
                  <th scope="col">Rol</th>
                  <th scope="col">XP Total</th>
                  <th scope="col">Racha</th>
                  <th scope="col">Registro</th>
                  <th scope="col">Estado</th>
                  <th scope="col" style="text-align:right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (u of filtered(); track u._id) {
                  <tr [style.opacity]="u.activo ? '1' : '0.55'">
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <div style="width:34px;height:34px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700"
                             [style.background]="rolAvatarBg(u.rol)"
                             [style.border]="'1.5px solid ' + rolAvatarColor(u.rol)"
                             [style.color]="rolAvatarColor(u.rol)"
                             aria-hidden="true">
                          {{ initials(u.nombre) }}
                        </div>
                        <div style="min-width:0">
                          <div style="font-size:14px;font-weight:700;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ u.nombre }}</div>
                          <div style="font-size:12px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ u.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <label class="sr-only" [attr.for]="'rol-' + u._id">Rol de {{ u.nombre }}</label>
                      <select [id]="'rol-' + u._id" [value]="u.rol" (change)="onRolChange(u._id, $event)"
                        class="gl-select" style="width:auto;padding:5px 28px 5px 10px;font-size:13px;height:34px">
                        <option value="estudiante">Estudiante</option>
                        <option value="profesor">Profesor</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    </td>
                    <td>
                      @if (u.rol === 'estudiante') {
                        <span class="gl-badge gl-badge-gold">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                          {{ u.xpTotal }}
                        </span>
                      } @else {
                        <span style="color:var(--muted);font-size:13px">—</span>
                      }
                    </td>
                    <td>
                      @if ((u.racha ?? 0) > 0) {
                        <div style="display:flex;align-items:center;gap:4px;color:var(--orange)">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--orange)" stroke="none" aria-hidden="true"><path d="M12 23c5.523 0 8-3.134 8-7 0-2.5-1.5-4.5-3-6-1 2-2 3-4 3-2 0-3-1.5-3-3-1 1.5-2 3-2 5 0 1.657.343 3.5 2 4.5-.5-1-.667-2 0-3C11 18 7 19.5 7 22c1.5.667 3.5 1 5 1z"/></svg>
                          <span style="font-size:13px;font-weight:700">{{ u.racha }}</span>
                        </div>
                      } @else {
                        <span style="color:var(--muted);font-size:13px">0</span>
                      }
                    </td>
                    <td style="font-size:12px;color:var(--muted)">{{ formatDate(u.fechaRegistro) }}</td>
                    <td>
                      <span class="gl-badge" [class]="u.activo ? 'gl-badge-green' : 'gl-badge-grey'">
                        {{ u.activo ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td style="text-align:right">
                      <button type="button" (click)="toggleActive(u._id, u.activo)"
                        class="gl-btn gl-btn-sm"
                        [class]="u.activo ? 'gl-btn-danger' : 'gl-btn-secondary'">
                        {{ u.activo ? 'Desactivar' : 'Reactivar' }}
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" style="text-align:center;padding:64px 16px">
                      <div style="display:flex;flex-direction:column;align-items:center;color:var(--muted)">
                        <div style="width:56px;height:56px;border-radius:var(--r-xl);background:var(--surface2);border:1.5px solid var(--border);display:flex;align-items:center;justify-content:center;margin-bottom:16px">
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <p style="font-size:14px;font-weight:600;color:var(--text2)">Sin usuarios</p>
                        <p style="font-size:12px;margin-top:4px">No se encontraron usuarios con los filtros actuales.</p>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  `,
})
export class UserManagementComponent {
  private readonly adminService = inject(AdminService);

  readonly query = signal('');
  readonly rolFilter = signal<RolFilter>('todos');
  readonly onlyInactive = signal(false);

  readonly roleFilters: readonly { value: RolFilter; label: string }[] = [
    { value: 'todos',         label: 'Todos' },
    { value: 'estudiante',    label: 'Estudiantes' },
    { value: 'profesor',      label: 'Profesores' },
    { value: 'administrador', label: 'Admins' },
  ];

  readonly users = toSignal(
    this.adminService.getUsuarios().pipe(catchError(() => of([]))),
    { initialValue: [] as AdminUser[] },
  );

  // Local mutable copy so optimistic updates work without full reload
  readonly localUsers = signal<AdminUser[]>([]);

  constructor() {
    effect(() => {
      const srv = this.users();
      if (srv.length > 0 && this.localUsers().length === 0) {
        this.localUsers.set([...srv]);
      }
    });
  }

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const r = this.rolFilter();
    const inactive = this.onlyInactive();
    const src = this.localUsers().length ? this.localUsers() : this.users();
    return src.filter((u) => {
      const matchRol    = r === 'todos' || u.rol === r;
      const matchQuery  = !q || u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchActive = !inactive || !u.activo;
      return matchRol && matchQuery && matchActive;
    });
  });

  countByRole(filter: RolFilter): number {
    const src = this.localUsers().length ? this.localUsers() : this.users();
    if (filter === 'todos') return src.length;
    return src.filter((u) => u.rol === filter).length;
  }

  initials(name: string): string {
    return getInitials(name);
  }

  rolAvatarColor(rol: string): string {
    return { estudiante: '#3B82F6', profesor: '#7C3AED', administrador: '#F97316' }[rol] ?? '#94A3B8';
  }

  rolAvatarBg(rol: string): string {
    return { estudiante: 'rgba(59,130,246,0.15)', profesor: 'rgba(124,58,237,0.15)', administrador: 'rgba(249,115,22,0.15)' }[rol] ?? 'rgba(148,163,184,0.15)';
  }

  formatDate(iso: string): string {
    return formatShortDate(iso);
  }

  onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  onRolChange(id: string, event: Event): void {
    const rol = (event.target as HTMLSelectElement).value as AdminUser['rol'];
    // Optimistic update
    this.localUsers.update((list) => list.map((u) => (u._id === id ? { ...u, rol } : u)));
    this.adminService.updateRol(id, rol).pipe(catchError(() => of(null))).subscribe();
  }

  toggleActive(id: string, current: boolean): void {
    const activo = !current;
    // Optimistic update
    this.localUsers.update((list) => list.map((u) => (u._id === id ? { ...u, activo } : u)));
    this.adminService.updateEstado(id, activo).pipe(catchError(() => of(null))).subscribe();
  }
}
