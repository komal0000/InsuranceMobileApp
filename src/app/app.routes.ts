import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    data: { preload: true },
    loadChildren: () =>
      import('./tabs/tabs.routes').then(m => m.tabsRoutes),
  },
  {
    path: 'enrollment-detail/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/enrollment-detail/enrollment-detail.page').then(m => m.EnrollmentDetailPage),
  },
  {
    path: 'enrollment-wizard/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/enrollment-wizard/enrollment-wizard.page').then(m => m.EnrollmentWizardPage),
  },
  {
    path: 'renewal-detail/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/renewal-detail/renewal-detail.page').then(m => m.RenewalDetailPage),
  },
  {
    path: 'renewal-search',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/renewal-search/renewal-search.page').then(m => m.RenewalSearchPage),
  },
  {
    path: 'payment',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/payment/payment.page').then(m => m.PaymentPage),
  },
  {
    path: 'payment-result',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/payment-result/payment-result.page').then(m => m.PaymentResultPage),
  },
  {
    path: 'home',
    redirectTo: 'tabs/dashboard',
    pathMatch: 'full',
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
