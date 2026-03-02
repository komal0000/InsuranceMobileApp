import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const tabsRoutes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../pages/dashboard/dashboard.page').then(m => m.DashboardPage),
      },
      {
        path: 'enrollments',
        loadComponent: () =>
          import('../pages/enrollments/enrollments.page').then(m => m.EnrollmentsPage),
      },
      {
        path: 'renewals',
        loadComponent: () =>
          import('../pages/renewals/renewals.page').then(m => m.RenewalsPage),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('../pages/notifications/notifications.page').then(m => m.NotificationsPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('../pages/profile/profile.page').then(m => m.ProfilePage),
      },
      {
        path: 'my-policy',
        loadComponent: () =>
          import('../pages/my-policy/my-policy.page').then(m => m.MyPolicyPage),
      },
      {
        path: 'my-payments',
        loadComponent: () =>
          import('../pages/my-payments/my-payments.page').then(m => m.MyPaymentsPage),
      },
      {
        path: 'subsidies',
        loadComponent: () =>
          import('../pages/subsidies/subsidies.page').then(m => m.SubsidiesPage),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
