import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Trigger } from '../../shared/models/trigger.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TriggerService {
  private apiUrl = environment.apiUrl;
  private triggerUrl = `${this.apiUrl}/triggers`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error("User not logged in. Cannot access triggers.");
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * GET /triggers: Fetches all trigger mappings.
   */
  getTriggers(): Observable<Trigger[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Trigger[]>(this.triggerUrl, { headers });
  }

  /**
   * GET /triggers/{id}: Fetches a single mapping by ID.
   */
  getTriggerById(id: number): Observable<Trigger> {
    const headers = this.getAuthHeaders();
    return this.http.get<Trigger>(`${this.triggerUrl}/${id}`, { headers });
  }

  /**
   * POST /triggers: Creates a new trigger mapping.
   */
  createTrigger(newTrigger: Trigger): Observable<Trigger> {
    const headers = this.getAuthHeaders();
    return this.http.post<Trigger>(this.triggerUrl, newTrigger, { headers });
  }

  /**
   * PUT /triggers/{id}: Updates an existing trigger mapping by ID.
   */
  updateTrigger(id: number, updateData: Partial<Trigger>): Observable<Trigger> {
    const headers = this.getAuthHeaders();
    return this.http.put<Trigger>(`${this.triggerUrl}/${id}`, updateData, { headers });
  }

  /**
   * DELETE /triggers/{id}: Removes a mapping.
   */
  deleteTrigger(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.triggerUrl}/${id}`, { headers });
  }
}