import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearLeccionDto, EstadoLeccion, Leccion } from '../models/learning.model';

export type { CrearLeccionDto, EstadoLeccion, Leccion, NivelLeccion } from '../models/learning.model';

@Injectable({ providedIn: 'root' })
export class LessonService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/lecciones`;

  getLecciones(): Observable<Leccion[]> {
    return this.http.get<Leccion[]>(this.url);
  }

  getMisLecciones(): Observable<Leccion[]> {
    return this.http.get<Leccion[]>(`${this.url}/mias`);
  }

  getLeccion(id: string): Observable<Leccion> {
    return this.http.get<Leccion>(`${this.url}/${id}`);
  }

  createLeccion(data: CrearLeccionDto): Observable<Leccion> {
    return this.http.post<Leccion>(this.url, data);
  }

  updateLeccion(id: string, data: Partial<CrearLeccionDto>): Observable<Leccion> {
    return this.http.put<Leccion>(`${this.url}/${id}`, data);
  }

  updateLeccionEstado(id: string, estado: EstadoLeccion): Observable<Leccion> {
    return this.http.patch<Leccion>(`${this.url}/${id}/estado`, { estado });
  }

  deleteLeccion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
