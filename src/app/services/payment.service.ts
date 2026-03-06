import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse } from '../interfaces/api-response.interface';
import { PaymentCreateResponse, PaymentStatusResponse } from '../interfaces/payment.interface';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private api: ApiService) {}

  /**
   * Create a payment and get the gateway redirect URL.
   */
  createPayment(
    gateway: 'khalti' | 'esewa' | 'ips',
    type: 'new' | 'renewal',
    options: { policy_id?: number; enrollment_id?: number; renewal_id?: number }
  ): Observable<ApiResponse<PaymentCreateResponse>> {
    return this.api.post<ApiResponse<PaymentCreateResponse>>('/payments/create', {
      gateway,
      type,
      ...options,
    });
  }

  /**
   * Poll payment status after gateway redirect.
   */
  getPaymentStatus(referenceId: string): Observable<ApiResponse<PaymentStatusResponse>> {
    return this.api.get<ApiResponse<PaymentStatusResponse>>(`/payments/status/${referenceId}`);
  }
}
