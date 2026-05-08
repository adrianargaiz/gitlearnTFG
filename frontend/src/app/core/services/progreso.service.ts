import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompletarProgresoResult, Progreso } from '../models/progress.model';
import { AuthService } from './auth.service';

export type { CompletarProgresoResult, Progreso } from '../models/progress.model';

@Injectable({ providedIn: 'root' })
export class ProgresoService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly url = `${environment.apiUrl}/progreso`;

  private readonly _misProgreso = signal<Progreso[]>([]);
  readonly misProgreso = this._misProgreso.asReadonly();

  loadMiProgreso(): Observable<Progreso[]> {
    const id = this.authService.currentUser()?._id ?? '';
    if (!id) return of([]);

    return this.http.get<Progreso[]>(`${this.url}/${id}`).pipe(
      tap((data) => this._misProgreso.set(data)),
      catchError(() => of([]))
    );
  }

  refresh(): void {
    this.loadMiProgreso().subscribe();
  }

  getMiProgreso(): Observable<Progreso[]> {
    const id = this.authService.currentUser()?._id ?? '';
    return this.http.get<Progreso[]>(`${this.url}/${id}`);
  }

  getProgreso(usuarioId: string): Observable<Progreso[]> {
    return this.http.get<Progreso[]>(`${this.url}/${usuarioId}`);
  }

  registrarCompletado(
    leccionId: string,
    aciertos: number,
    total: number
  ): Observable<CompletarProgresoResult> {
    return this.http.post<CompletarProgresoResult>(this.url, { leccionId, aciertos, total });
  }
}
