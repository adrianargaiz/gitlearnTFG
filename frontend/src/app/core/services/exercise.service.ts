import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CrearEjercicioDto, Ejercicio } from '../models/learning.model';

export type { CrearEjercicioDto, Ejercicio, TipoEjercicio } from '../models/learning.model';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ejercicios`;

  getEjercicios(leccionId: string): Observable<Ejercicio[]> {
    return this.http.get<Ejercicio[]>(`${this.url}/${leccionId}`);
  }

  createEjercicio(data: CrearEjercicioDto): Observable<Ejercicio> {
    return this.http.post<Ejercicio>(this.url, data);
  }

  updateEjercicio(id: string, data: Partial<CrearEjercicioDto>): Observable<Ejercicio> {
    return this.http.put<Ejercicio>(`${this.url}/${id}`, data);
  }

  deleteEjercicio(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
