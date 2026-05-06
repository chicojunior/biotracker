import { AppNavigation } from './AppNavigation';

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background md:flex-row">
      <AppNavigation />

      <main className="h-full w-full flex-1 overflow-y-auto pb-24 md:pb-0">
        <div className="mx-auto w-full max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
