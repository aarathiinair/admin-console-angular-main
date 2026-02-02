import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Certificate, CertificateCreateRequest, CertificateListResponse } from '../../shared/models/certificate.model';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private apiUrl = `${environment.apiUrl}/certificates`;

  constructor(private http: HttpClient) {}

  getCertificates(
    page: number, 
    pageSize: number, 
    statusFilter?: string,
    startDate?: Date | null,
    endDate?: Date | null,
    responsibleGroup?: string
  ): Observable<CertificateListResponse> {
    
    let params = this.buildParams(page, pageSize, statusFilter, startDate, endDate, responsibleGroup);
    return this.http.get<CertificateListResponse>(`${this.apiUrl}/`, { params });
  }

  downloadCertificates(
    statusFilter?: string,
    startDate?: Date | null,
    endDate?: Date | null,
    responsibleGroup?: string
  ): Observable<Blob> {
    let params = this.buildParams(0, 0, statusFilter, startDate, endDate, responsibleGroup);
    
    return this.http.get(`${this.apiUrl}/download`, { 
      params, 
      responseType: 'blob'
    });
  }

  createCertificate(cert: CertificateCreateRequest): Observable<Certificate> {
    return this.http.post<Certificate>(`${this.apiUrl}/`, cert);
  }

  updateCertificate(id: number, cert: Partial<CertificateCreateRequest>): Observable<Certificate> {
    return this.http.put<Certificate>(`${this.apiUrl}/${id}`, cert);
  }

  deleteCertificate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private buildParams(
    page: number, 
    pageSize: number, 
    statusFilter?: string, 
    startDate?: Date | null, 
    endDate?: Date | null, 
    responsibleGroup?: string
  ): HttpParams {
    let params = new HttpParams();
    
    if (page > 0) params = params.set('page', page.toString());
    if (pageSize > 0) params = params.set('page_size', pageSize.toString());

    if (statusFilter && statusFilter !== 'null') {
      params = params.set('status_filter', statusFilter);
    }
    
    if (responsibleGroup && responsibleGroup !== 'null') {
      params = params.set('responsible_group', responsibleGroup);
    }

    if (startDate) {
      params = params.set('start_date', startDate.toISOString());
    }

    if (endDate) {
      params = params.set('end_date', endDate.toISOString());
    }
    
    return params;
  }
}