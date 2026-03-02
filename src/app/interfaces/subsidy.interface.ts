export interface Subsidy {
  id: number;
  enrollment_id: number;
  enrollment_number?: string;
  benefit_type?: string;
  fiscal_year?: string;
  status: string;
  amount?: number;
  reason?: string;
  audit_log?: SubsidyAuditEntry[];
  created_at?: string;
  updated_at?: string;
  enrollment?: any;
}

export interface SubsidyAuditEntry {
  id: number;
  action: string;
  performed_by?: string;
  reason?: string;
  created_at?: string;
}
