import { HttpParams } from "@angular/common/http";

export interface ReportRequest {
  start_date: Date;
  end_date: Date;
  filter_type?: string | null;
  filter_priority?: string | null;
  filter_source?: string | null;
  page: number;
  page_size: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ReportDataRow {
  email_id: string;
  sender: string;
  subject: string;
  received_at: Date;
  type: string;
  priority: string;
  jiraticket_id: string | null;
  timestamp: Date | null;
  assigned_to: string | null;
  teams_channel: string | null;
}

export interface ReportResponse {
  data: ReportDataRow[];
  total_rows: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export class ReportParamBuilder {
  private formatDateTime(date: Date): string {
    return date.toISOString().slice(0, 19);
  }

  buildParams(request: ReportRequest): HttpParams {
    let params = new HttpParams();

    params = params.set('start_date', this.formatDateTime(request.start_date));
    params = params.set('end_date', this.formatDateTime(request.end_date));

    // Pagination
    params = params.set('page', request.page.toString());
    params = params.set('page_size', request.page_size.toString());

    if (request.filter_type) {
      params = params.set('filter_type', request.filter_type);
    }
    if (request.filter_priority) {
      params = params.set('filter_priority', request.filter_priority);
    }
    if (request.filter_source) {
      params = params.set('filter_source', request.filter_source);
    }

    // Sorting
    if (request.sort_by) {
      params = params.set('sort_by', request.sort_by);
    }
    if (request.sort_order) {
      params = params.set('sort_order', request.sort_order);
    }

    return params;
  }
}