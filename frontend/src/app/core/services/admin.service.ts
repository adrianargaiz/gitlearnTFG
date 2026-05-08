import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminLeccion, AdminUser } from '../models/admin.model';
import { EstadoLeccion } from '../models/learning.model';

export type { AdminLeccion, AdminUser } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin`;

  getUsuarios(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.baseUrl}/usuarios`);
  }

  updateRol(id: string, rol: AdminUser['rol']): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.baseUrl}/usuarios/${id}/rol`, { rol });
  }

  updateEstado(id: string, activo: boolean): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.baseUrl}/usuarios/${id}/estado`, { activo });
  }

  getLecciones(): Observable<AdminLeccion[]> {
    return this.http.get<AdminLeccion[]>(`${this.baseUrl}/lecciones`);
  }

  updateLeccionEstado(id: string, estado: EstadoLeccion): Observable<AdminLeccion> {
    return this.http.put<AdminLeccion>(`${this.baseUrl}/lecciones/${id}/estado`, { estado });
  }
}
