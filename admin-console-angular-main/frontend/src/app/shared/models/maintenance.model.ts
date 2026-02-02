export type MaintenanceStatus = 'Scheduled' | 'Ongoing' | 'Completed';

// Represents a SINGLE row from the DB (one server)
export interface MaintenanceItem {
    id: number;
    // Title Removed
    status: MaintenanceStatus;
    
    server_group: string;
    server_name: string | null;  // Single server name
    other_server: string | null; // Renamed from other_server_group_name
    
    comments: string | null;
    start_datetime: string;
    end_datetime: string;
    created_at: string;
    updated_at: string;
}

export interface DisplayMaintenanceItem extends Omit<MaintenanceItem, 'start_datetime' | 'end_datetime' | 'status'> {
    start_datetime: Date;
    end_datetime: Date;
    status: string;
}

// Request payload (Frontend sends aggregated selection)
export interface MaintenanceCreateRequest {
    // Title Removed
    server_group: string;
    servers: string[]; // Still sending list to generate multiple rows
    other_server: string | null; // Renamed
    
    comments: string | null;
    start_datetime: string;
    end_datetime: string;
}

export interface MaintenanceUpdateRequest {
    // Title Removed
    server_group?: string;
    server_name?: string; // Update single row
    other_server?: string | null;
    
    comments?: string | null;
    start_datetime?: string;
    end_datetime?: string;
    status?: MaintenanceStatus;
}

export interface MaintenanceListResponse {
    items: MaintenanceItem[];
    total_rows: number;
    page: number;
    page_size: number;
}