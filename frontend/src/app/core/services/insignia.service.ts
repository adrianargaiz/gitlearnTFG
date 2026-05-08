import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Insignia } from '../models/badge.model';
import { AuthService } from './auth.service';

export type { Insignia } from '../models/badge.model';

@Injectable({ providedIn: 'root' })
export class InsigniaService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly url = `${environment.apiUrl}/insignias`;

  getInsignias(): Observable<Insignia[]> {
    return this.http.get<Insignia[]>(this.url);
  }

  getMisInsignias(): Observable<Insignia[]> {
    const id = this.authService.currentUser()?._id ?? '';
    return this.http.get<Insignia[]>(`${this.url}/${id}`);
  }

  getInsigniasUsuario(usuarioId: string): Observable<Insignia[]> {
    return this.http.get<Insignia[]>(`${this.url}/${usuarioId}`);
  }
}
