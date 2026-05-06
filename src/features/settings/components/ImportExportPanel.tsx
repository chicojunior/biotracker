import { Download, Upload } from "lucide-react";

type ImportExportPanelProps = {
  onExport?: () => void;
  onImport?: () => void;
};

export function ImportExportPanel({
  onExport,
  onImport,
}: ImportExportPanelProps) {
  const exportUnavailable = !onExport;
  const importUnavailable = !onImport;

  return (
    <div className="grid gap-4">
      <div>
        <h3 className="font-medium text-foreground">Local data tools</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Export and import actions are reserved for local backup workflows. No
          cloud account is required.
        </p>
      </div>

      <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onExport}
          disabled={exportUnavailable}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/70 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          Export JSON
        </button>
        <button
          type="button"
          onClick={onImport}
          disabled={importUnavailable}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/70 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Upload aria-hidden="true" className="h-4 w-4" />
          Import JSON
        </button>
      </div>

      {(exportUnavailable || importUnavailable) && (
        <p className="text-sm leading-6 text-muted-foreground">
          Backup actions are unavailable in this version.
        </p>
      )}
    </div>
  );
}
