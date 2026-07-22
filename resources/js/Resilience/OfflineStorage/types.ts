export interface CachedCode {
    hash: string;
    visitor_name: string;
    host_name: string;
    expires_at: string;
    has_vehicle: boolean;
    purpose?: string;
    code_type?: string;
    guest_limit?: number | null;
    uses_count?: number;
    starts_at?: string | null;
}

export interface OfflineLog {
    id?: number;
    code: string;
    decision: 'admit' | 'reject';
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_plate_number?: string;
    created_at: string;
}
