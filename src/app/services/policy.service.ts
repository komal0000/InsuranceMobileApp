import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { MyPolicyPayload } from '../interfaces/policy.interface';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  constructor(private api: ApiService) {}

  getMyPolicy(): Observable<MyPolicyPayload> {
    return this.api.get<ApiResponse<Partial<MyPolicyPayload>>>('/my-policy').pipe(
      map((response) => ({
        policy: response.data?.policy ?? null,
        history: Array.isArray(response.data?.history) ? response.data.history : [],
      }))
    );
  }
}
