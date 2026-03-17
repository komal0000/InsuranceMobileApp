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

  router.navigateByUrl('/tabs/dashboard', { replaceUrl: true });
  return false;
};
