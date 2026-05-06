import { History, LayoutList } from "lucide-react";

import type { DailyHealthEntry } from "../../types/health";
import { EntryDetailPanel } from "./components/EntryDetailPanel";
import { EntryList } from "./components/EntryList";

export type HistoryPageProps = {
  entries: DailyHealthEntry[];
  selectedEntryId?: string | null;
  onSelectEntry?: (entryId: string) => void;
  onEditEntry?: (entryId: string) => void;
  onDeleteEntry?: (entryId: string) => void;
  isListLoading?: boolean;
  isDetailLoading?: boolean;
  listErrorMessage?: string;
  detailErrorMessage?: string;
  listStatusMessage?: string;
  detailStatusMessage?: string;
  pageStatusMessage?: string;
};

function sortEntriesByDate(entries: DailyHealthEntry[]) {
  return [...entries].sort((leftEntry, rightEntry) => {
    return new Date(rightEntry.date).getTime() - new Date(leftEntry.date).getTime();
  });
}

export function HistoryPage({
  entries,
  selectedEntryId,
  onSelectEntry,
  onEditEntry,
  onDeleteEntry,
  isListLoading = false,
  isDetailLoading = false,
  listErrorMessage,
  detailErrorMessage,
  listStatusMessage,
  detailStatusMessage,
  pageStatusMessage,
}: HistoryPageProps) {
  const sortedEntries = sortEntriesByDate(entries);
  const selectedEntry =
    sortedEntries.find((entry) => entry.id === selectedEntryId) ??
    sortedEntries[0] ??
    null;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="grid gap-4 border-b border-border pb-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-sm font-medium text-primary">BioTracker</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              <History aria-hidden="true" className="h-8 w-8 text-primary" />
              History
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Review previous days, inspect recorded values, and keep past health
              notes easy to revisit.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Saved days
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {sortedEntries.length}
            </p>
          </div>
        </header>

        {pageStatusMessage ? (
          <p
            role="status"
            className="rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground"
          >
            {pageStatusMessage}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.85fr)] lg:items-start">
          <section
            aria-labelledby="history-entry-list"
            className="rounded-xl border border-border bg-background/40 p-0"
          >
            <div className="mb-4 flex items-center gap-3 px-1">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-card text-primary shadow-sm">
                <LayoutList aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 id="history-entry-list" className="text-lg font-semibold text-foreground">
                  Entry list
                </h2>
                <p className="text-sm text-muted-foreground">
                  Newest records first, optimized for quick review on any screen.
                </p>
              </div>
            </div>

            <EntryList
              entries={sortedEntries}
              selectedEntryId={selectedEntry?.id ?? selectedEntryId}
              onSelectEntry={onSelectEntry}
              isLoading={isListLoading}
              errorMessage={listErrorMessage}
              statusMessage={listStatusMessage}
            />
          </section>

          <div className="lg:sticky lg:top-6">
            <EntryDetailPanel
              entry={selectedEntry}
              onEditEntry={onEditEntry}
              onDeleteEntry={onDeleteEntry}
              isLoading={isDetailLoading}
              errorMessage={detailErrorMessage}
              statusMessage={detailStatusMessage}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
