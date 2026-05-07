export interface Payment {
  id: number;
  user_id: number;
  policy_id: number;
  amount: number;
  gateway: 'khalti' | 'esewa' | 'ips';
  type: 'new' | 'renewal';
  reference_id: string;
  gateway_transaction_id: string | null;
  status: 'pending' | 'paid' | 'failed';
  paid_at: string | null;
  gateway_response?: any;
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InsurancePolicy {
  id: number;
  user_id: number;
  enrollment_id: number | null;
  policy_number: string;
  premium_amount: number;
  start_date: string | null;
  next_due_date: string | null;
  status: 'pending' | 'active' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface PaymentCreateResponse {
  redirect_url?: string;
  html_content?: string;
  reference_id?: string;
  payment_id?: number;
  policy_id?: number;
  locked_amount?: number;
  attempt_number?: number;
  retry_allowed?: boolean;
  requires_payment?: boolean;
  renewal_id?: number;
  payment_method?: string;
}

export interface PaymentRetryMeta {
  retry_allowed: boolean;
  retry_count: number;
  attempt_number: number;
  locked_amount: number | null;
  latest_reference_id: string | null;
  latest_status: 'pending' | 'paid' | 'failed' | null;
}

export interface PaymentStatusResponse {
  payment: Payment;
  policy: InsurancePolicy;
  retry?: PaymentRetryMeta;
}
