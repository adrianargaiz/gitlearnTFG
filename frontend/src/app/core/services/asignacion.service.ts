import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Asignacion,
  AsignacionConDetalle,
  CrearAsignacionDto,
  EstudianteResumen,
} from '../models/learning.model';

export type { AsignacionConDetalle, EstudianteResumen } from '../models/learning.model';

@Injectable({ providedIn: 'root' })
export class AsignacionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/asignaciones`;

  getMisAsignaciones(): Observable<AsignacionConDetalle[]> {
    return this.http.get<AsignacionConDetalle[]>(`${this.url}/mias`);
  }

  getMisAsignacionesProfesor(): Observable<Asignacion[]> {
    return this.http.get<Asignacion[]>(`${this.url}/mis-asignaciones`);
  }

  getAsignacionesPorLeccion(leccionId: string): Observable<Asignacion[]> {
    return this.http.get<Asignacion[]>(`${this.url}/por-leccion/${leccionId}`);
  }

  getEstudiantes(): Observable<EstudianteResumen[]> {
    return this.http.get<EstudianteResumen[]>(`${this.url}/estudiantes`);
  }

  createAsignacion(dto: CrearAsignacionDto): Observable<Asignacion> {
    return this.http.post<Asignacion>(this.url, dto);
  }

  deleteAsignacion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
