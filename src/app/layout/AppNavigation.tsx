import { Activity } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { APP_NAV_ITEMS } from '../navigation';

export function AppNavigation() {
  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around items-center h-16 px-2 pb-[env(safe-area-inset-bottom)]">
          {APP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <nav className="hidden md:flex flex-col w-64 h-full bg-card border-r border-border z-50">
        <div className="p-6">
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="text-primary" />
            BioTracker
          </h1>
        </div>
        <div className="flex-1 px-4 py-2 space-y-2">
          {APP_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
