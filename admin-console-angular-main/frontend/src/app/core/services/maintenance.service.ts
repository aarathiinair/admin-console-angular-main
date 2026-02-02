import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  MaintenanceItem, 
  MaintenanceCreateRequest, 
  MaintenanceUpdateRequest,
  MaintenanceListResponse 
} from '../../shared/models/maintenance.model'; 
 
@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private apiUrl = `${environment.apiUrl}/maintenance`;
 
  constructor(private http: HttpClient) { }

  private formatDateTime(date: Date): string {
    return date.toISOString().slice(0, 19); 
  }
 
  /** Fetches a paginated and sorted list of maintenance windows with optional group filtering. */
  getMaintenances(
      page: number, 
      pageSize: number, 
      sortBy: string, 
      sortDir: 'asc' | 'desc',
      groups?: string[] // Optional parameter for filtering
  ): Observable<MaintenanceListResponse> {
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString())
      .set('sort_by', sortBy)
      .set('sort_dir', sortDir);

    if (groups && groups.length > 0) {
        groups.forEach(group => {
            params = params.append('groups', group);
        });
    }

    return this.http.get<MaintenanceListResponse>(this.apiUrl, { params });
}
 
  /** Creates a new maintenance window. */
  createMaintenance(request: MaintenanceCreateRequest): Observable<MaintenanceItem> {
    const formattedRequest = {
        ...request,
        start_datetime: this.formatDateTime(new Date(request.start_datetime)),
        end_datetime: this.formatDateTime(new Date(request.end_datetime)),
    };
    return this.http.post<MaintenanceItem>(this.apiUrl, formattedRequest);
  }
 
  /** Updates an existing maintenance window. */
  updateMaintenance(maintenanceId: number, request: MaintenanceUpdateRequest): Observable<MaintenanceItem> {
    const formattedRequest: MaintenanceUpdateRequest = { ...request };
    
    if (request.start_datetime) {
        formattedRequest.start_datetime = this.formatDateTime(new Date(request.start_datetime));
    }
    if (request.end_datetime) {
        formattedRequest.end_datetime = this.formatDateTime(new Date(request.end_datetime));
    }
    
    return this.http.put<MaintenanceItem>(`${this.apiUrl}/${maintenanceId}`, formattedRequest);
  }
 
  /** Deletes a maintenance window. */
  deleteMaintenance(maintenanceId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${maintenanceId}`);
  }
}