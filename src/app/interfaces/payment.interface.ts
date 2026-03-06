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
  gateway_response: any;
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
  redirect_url: string;
  reference_id: string;
  payment_id: number;
  policy_id: number;
}

export interface PaymentStatusResponse {
  payment: Payment;
  policy: InsurancePolicy;
}
