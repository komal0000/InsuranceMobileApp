import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
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
