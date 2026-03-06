export interface Subsidy {
  id: number;
  enrollment_id: number;
  enrollment_number?: string;
  benefit_type?: string;
  benefit_value?: number;
  discount_amount?: number;
  original_premium?: number;
  final_premium?: number;
  fiscal_year?: string;
  status: string;
  amount?: number;
  reason?: string;
  policy_rule?: PolicyRuleSummary;
  audit_log?: SubsidyAuditEntry[];
  created_at?: string;
  updated_at?: string;
  enrollment?: any;
}

export interface PolicyRuleSummary {
  id: number;
  code: string;
  name: string;
  benefit_type: string;
  benefit_value: number;
}

export interface SubsidyAuditEntry {
  id: number;
  action: string;
  performed_by?: string;
  reason?: string;
  created_at?: string;
}
