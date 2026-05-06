import { ReactNode } from "react";

type ReportSectionProps = {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  variant?: "default" | "warning" | "muted";
};

export function ReportSection({ title, icon, children, variant = "default" }: ReportSectionProps) {
  const bgClasses = {
    default: "bg-card border-border",
    warning: "bg-accent/10 border-accent/20",
    muted: "bg-secondary/50 border-secondary",
  };

  return (
    <section className={`rounded-xl border ${bgClasses[variant]} p-6 shadow-sm`}>
      <header className="flex items-center gap-3 mb-4">
        {icon && <div className="text-primary">{icon}</div>}
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      </header>
      <div className="text-foreground text-sm leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  );
}
