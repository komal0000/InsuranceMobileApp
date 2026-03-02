import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular/standalone';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastCtrl = inject(ToastController);

  const token = authService.getToken();
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
  } else {
    authReq = req.clone({
      setHeaders: { Accept: 'application/json' },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.clearSession().then(() => {
          router.navigateByUrl('/login');
        });
      }
      const message = error.error?.message || error.message || 'An error occurred';
      toastCtrl.create({
        message,
        duration: 3000,
        color: 'danger',
        position: 'top',
      }).then(toast => toast.present());
      return throwError(() => error);
    })
  );
};
