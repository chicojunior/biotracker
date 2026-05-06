import { createHashRouter, Navigate, Outlet } from 'react-router-dom';

import { HomePage } from '../features/home/HomePage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { ReportsRoute } from '../features/reports/ReportsRoute';
import { SettingsRoute } from '../features/settings/SettingsRoute';
import { AppShell } from './layout/AppShell';

function PlaceholderPage({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <section className="flex min-h-full flex-col gap-4 px-4 py-8 md:px-8 md:py-10">
      <p className="text-sm font-medium text-primary">BioTracker</p>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}

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
        element: (
          <PlaceholderPage
            title="Nova entrada"
            description="A captura manual diaria sera conectada na proxima fatia, aproveitando validacao e storage ja existentes."
          />
        ),
      },
      {
        path: 'history',
        element: (
          <PlaceholderPage
            title="Historico"
            description="A revisao e edicao de registros vai usar o mesmo modelo diario ja persistido no storage local."
          />
        ),
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