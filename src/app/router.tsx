import { createHashRouter, Navigate, Outlet } from 'react-router-dom';

import { EntryRoute } from '../features/entry/EntryRoute';
import { HistoryRoute } from '../features/history/HistoryRoute';
import { HomePage } from '../features/home/HomePage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { ReportsRoute } from '../features/reports/ReportsRoute';
import { SettingsRoute } from '../features/settings/SettingsRoute';
import { AppShell } from './layout/AppShell';

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export const router = createHashRouter([
  {
    path: '/',
    element: <ShellLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'entry',
        element: <EntryRoute />,
      },
      {
        path: 'history',
        element: <HistoryRoute />,
      },
      {
        path: 'reports',
        element: <ReportsRoute PageComponent={ReportsPage} />,
      },
      {
        path: 'settings',
        element: <SettingsRoute />,
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);
