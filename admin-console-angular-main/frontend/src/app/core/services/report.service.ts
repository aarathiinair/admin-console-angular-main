import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReportResponse, ReportRequest, ReportParamBuilder } from '../../shared/models/report.model';
import { environment } from '../../../environments/environment';
 
@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly baseUrl = `${environment.apiUrl}/data`;
  private paramBuilder = new ReportParamBuilder();
 
  constructor(private http: HttpClient) { }
 
  // Helper function to format Date object to ISO 8601 string with time
  private formatDateTime(date: Date): string {
    return date.toISOString().slice(0, 19); 
  }
 
  private formatRequestBody<T extends ReportRequest>(request: T): any {
    const body: any = {
        ...request,
        start_date: this.formatDateTime(request.start_date), 
        end_date: this.formatDateTime(request.end_date)
    };

    body.filter_type = body.filter_type === "" ? null : body.filter_type;
    body.filter_priority = body.filter_priority === "" ? null : body.filter_priority;
    body.filter_source = body.filter_source === "" ? null : body.filter_source;
    
    return body;
  }
 
  /**
   * Fetches paginated and filtered report data for the UI table.
   * Corresponds to GET /api/reports/data/
   */
  getReportData(request: ReportRequest): Observable<ReportResponse> {
    const params = this.paramBuilder.buildParams(request);
    
    return this.http.get<ReportResponse>(this.baseUrl, { params });
  }
 
  /**
   * Triggers the download of the full report as a CSV file.
   * Corresponds to POST /api/reports/data/download
   */
    downloadReport(request: ReportRequest): Observable<Blob> {
    const url = `${this.baseUrl}/download`;
    // Use the formatted body which includes time
    const formattedBody = this.formatRequestBody(request);
    
    return this.http.post(url, formattedBody, {
      responseType: 'blob' as 'json'
    }) as Observable<Blob>;
  }

  triggerFileDownload(data: Blob, filename: string) {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}