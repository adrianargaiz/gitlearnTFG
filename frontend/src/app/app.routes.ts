import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // ── Public ──────────────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'auth/github/callback',
    loadComponent: () =>
      import('./features/auth/github-callback/github-callback.component').then(
        (m) => m.GithubCallbackComponent
      ),
  },

  // ── Student area ─────────────────────────────────────────────────────────────
  {
    path: 'app',
    canActivate: [authGuard, roleGuard('estudiante')],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/lessons/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'lecciones',
        loadComponent: () =>
          import('./features/lessons/lesson-map/lesson-map.component').then(
            (m) => m.LessonMapComponent
          ),
      },
      {
        path: 'lecciones/:id',
        loadComponent: () =>
          import('./features/lessons/lesson-view/lesson-view.component').then(
            (m) => m.LessonViewComponent
          ),
      },
      {
        path: 'progreso',
        loadComponent: () =>
          import('./features/progress/progress.component').then((m) => m.ProgressComponent),
      },
      {
        path: 'tareas',
        loadComponent: () =>
          import('./features/lessons/tareas/tareas.component').then((m) => m.TareasComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ── Teacher area ──────────────────────────────────────────────────────────────
  {
    path: 'profesor',
    canActivate: [authGuard, roleGuard('profesor', 'administrador')],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/teacher/teacher-dashboard/teacher-dashboard.component').then(
            (m) => m.TeacherDashboardComponent
          ),
      },
      {
        path: 'lecciones',
        loadComponent: () =>
          import('./features/teacher/lesson-list/lesson-list.component').then(
            (m) => m.LessonListComponent
          ),
      },
      {
        path: 'lecciones/nueva',
        loadComponent: () =>
          import('./features/teacher/lesson-editor/lesson-editor.component').then(
            (m) => m.LessonEditorComponent
          ),
      },
      {
        path: 'lecciones/:id',
        loadComponent: () =>
          import('./features/teacher/lesson-editor/lesson-editor.component').then(
            (m) => m.LessonEditorComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ── Admin area ────────────────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('administrador')],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/user-management/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: 'contenido',
        loadComponent: () =>
          import('./features/admin/content-moderation/content-moderation.component').then(
            (m) => m.ContentModerationComponent
          ),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // ── Fallback ──────────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
