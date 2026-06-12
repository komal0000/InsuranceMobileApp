import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.init();

  if (!authService.isAuthenticated()) {
    return true;
  }

  const user = authService.getCurrentUser();
  const targetUrl = user?.kyc_required && !user?.kyc_submitted && (user.can_perform_kyc ?? true)
    ? '/kyc'
    : '/tabs/dashboard';

  router.navigateByUrl(targetUrl, { replaceUrl: true });
  return false;
};
