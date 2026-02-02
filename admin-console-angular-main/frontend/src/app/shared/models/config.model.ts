export interface ConfigResponse {
  id: string;
  user_id: string;
  created_at: string;
  
  job_frequency: number;
  outlook_email: string;
  outlook_server: string;
  jira_base_url: string;
  jira_email: string;
  jira_api_token: string;
}

export interface ConfigUpdate {
  job_frequency: number | null;
  outlook_email: string | null;
  outlook_server: string | null;
  jira_base_url: string | null;
  jira_email: string | null;
  jira_api_token: string | null;
}

export interface WebhookMapping {
  id?: string;
  channel_name: string;
  webhook_url: string;
}