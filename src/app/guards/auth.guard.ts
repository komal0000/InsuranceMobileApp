import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.init();

  if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser();
    const targetUrl = state.url || '';

    if (user?.kyc_required && !user?.kyc_submitted && (user.can_perform_kyc ?? true) && !targetUrl.startsWith('/kyc')) {
      router.navigateByUrl('/kyc', { replaceUrl: true });
      return false;
    }

    return true;
  }

  router.navigateByUrl('/login');
  return false;
};
