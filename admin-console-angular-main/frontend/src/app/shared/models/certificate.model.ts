export type CertificateStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

export interface Certificate {
  id: number;                    // Changed from cert_id (UUID) to id (number)
  certificate_name: string;      // Changed from certificate_title
  expiration_date: string;
  description?: string;
  usage?: string;
  calculated_status: CertificateStatus;  // Changed from status
  responsible_group: string;     // New field
  teams_channel: string;         // New field
  effected_users?: string;       // New field (note: typo from backend)
  created_at: string;            // New field
  updated_at: string;            // New field
  jira_ticket_id?: string;       // From JOIN
}

export interface CertificateCreateRequest {
  certificate_name: string;
  expiration_date: string;
  description?: string;
  usage?: string;
  responsible_group: string;
  teams_channel: string;
  effected_users?: string;
}

export interface CertificateListResponse {
  items: Certificate[];
  total_rows: number;
  page: number;
  page_size: number;
}