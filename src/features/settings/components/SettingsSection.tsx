import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type SettingsSectionProps = {
  children: ReactNode;
  description?: string;
  icon: LucideIcon;
  id: string;
  title: string;
};

export function SettingsSection({
  children,
  description,
  icon: Icon,
  id,
  title,
}: SettingsSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-lg border border-border bg-card text-card-foreground shadow-soft"
    >
      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-8">
        <div className="flex gap-3">
          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-primary">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 id={id} className="text-lg font-semibold tracking-normal">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 max-w-prose text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
