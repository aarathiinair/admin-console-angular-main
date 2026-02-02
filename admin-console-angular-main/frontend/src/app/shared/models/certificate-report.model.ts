export interface CertReportRequest {
  search_date_start?: Date | null;
  search_date_end?: Date | null;
  search_person?: string | null;
  search_teams?: string | null;
  filter_status?: string | null;
  search_name?: string | null;
  page: number;
  page_size: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

export interface CertDataRow {
  cert_id: string;
  certificate_name: string;
  expiration_date: string; // ISO string
  status: string;
  responsible_person?: string;
  teams_channel?: string;
  description?: string;
  usage?: string;
  jira_reference?: string;
  affected_persons?: string;
}

export interface CertReportResponse {
  data: CertDataRow[];
  total_rows: number;
  page: number;
  page_size: number;
  total_pages: number;
}