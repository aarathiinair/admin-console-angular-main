import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CertReportRequest, CertReportResponse } from '../../shared/models/certificate-report.model';

@Injectable({
  providedIn: 'root'
})
export class CertificateReportService {
  private readonly baseUrl = `${environment.apiUrl}/certificates`;

  constructor(private http: HttpClient) { }

  private formatDateTime(date: Date): string {
    return date.toISOString().slice(0, 19);
  }

  private prepareBody(request: CertReportRequest): any {
    const body: any = { ...request };
    if (request.search_date_start) body.search_date_start = this.formatDateTime(request.search_date_start);
    if (request.search_date_end) body.search_date_end = this.formatDateTime(request.search_date_end);
    return body;
  }

  getReportData(request: CertReportRequest): Observable<CertReportResponse> {
    return this.http.post<CertReportResponse>(`${this.baseUrl}/data`, this.prepareBody(request));
  }

  downloadReport(request: CertReportRequest): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/download`, this.prepareBody(request), {
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