import { Activity, ClipboardPlus, History, Settings, Sparkles } from 'lucide-react';

export type AppNavItem = {
  icon: typeof Activity;
  id: string;
  label: string;
  to: string;
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { id: 'home', label: 'Início', icon: Activity, to: '/' },
  { id: 'entry', label: 'Nova entrada', icon: ClipboardPlus, to: '/entry' },
  { id: 'history', label: 'Histórico', icon: History, to: '/history' },
  { id: 'reports', label: 'Relatórios', icon: Sparkles, to: '/reports' },
  { id: 'settings', label: 'Configurações', icon: Settings, to: '/settings' },
];