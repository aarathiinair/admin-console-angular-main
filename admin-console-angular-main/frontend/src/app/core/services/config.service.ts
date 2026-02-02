import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConfigResponse, ConfigUpdate, WebhookMapping } from '../../shared/models/config.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private apiUrl = environment.apiUrl;
  private configUrl = `${this.apiUrl}/parameters`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  /**
   * Helper function to include the JWT in the request headers
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error("User not logged in. Cannot fetch config.");
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * GET /parameters: Fetches the current or default configuration.
   */
  loadConfiguration(): Observable<ConfigResponse> {
    const headers = this.getAuthHeaders();
    return this.http.get<ConfigResponse>(this.configUrl, { headers });
  }

  /**
   * POST /parameters: Saves a new configuration entry.
   */
  saveConfiguration(configData: ConfigUpdate): Observable<ConfigResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<ConfigResponse>(this.configUrl, configData, { headers });
  }

  getWebhooks(): Observable<WebhookMapping[]> {
    return this.http.get<WebhookMapping[]>(`${this.apiUrl}/webhooks`, { headers: this.getAuthHeaders() });
  }

  addWebhook(data: WebhookMapping): Observable<WebhookMapping> {
    return this.http.post<WebhookMapping>(`${this.apiUrl}/webhooks`, data, { headers: this.getAuthHeaders() });
  }

  updateWebhook(id: string, data: WebhookMapping): Observable<WebhookMapping> {
    const headers = this.getAuthHeaders();
    return this.http.put<WebhookMapping>(`${this.apiUrl}/webhooks/${id}`, data, { headers });
  }

  deleteWebhook(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/webhooks/${id}`, { headers: this.getAuthHeaders() });
  }
}