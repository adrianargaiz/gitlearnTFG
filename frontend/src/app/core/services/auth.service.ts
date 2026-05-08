import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  ROLE_HOME_PATH,
} from '../constants/auth.constants';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../models/auth.model';

export type { AuthResponse, LoginCredentials, RegisterCredentials, User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly _currentUser = signal<User | null>(this.loadUserFromStorage());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userRole = computed(() => this._currentUser()?.rol ?? null);

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  register(credentials: RegisterCredentials): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, credentials)
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    this._currentUser.set(null);
    void this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  }

  loginWithGitHub(): void {
    window.location.href = `${environment.apiUrl}/auth/github`;
  }

  loginWithToken(token: string): Observable<User> {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);

    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
        this._currentUser.set(user);
      })
    );
  }

  refreshUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`).pipe(
      tap((user) => {
        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
        this._currentUser.set(user);
      })
    );
  }

  redirectByRole(rol: User['rol']): void {
    void this.router.navigate([ROLE_HOME_PATH[rol]]);
  }

  private handleAuthSuccess(res: AuthResponse): void {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, res.token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(res.user));
    this._currentUser.set(res.user);
    this.redirectByRole(res.user.rol);
  }

  private loadUserFromStorage(): User | null {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number };

      if (!payload.exp || payload.exp * 1000 < Date.now()) {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        return null;
      }

      const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      return storedUser ? (JSON.parse(storedUser) as User) : null;
    } catch {
      localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_USER_STORAGE_KEY);
      return null;
    }
  }
}
