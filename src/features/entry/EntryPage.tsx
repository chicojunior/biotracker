import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

import {
  EntryForm,
  type EntryFormFieldKey,
  type EntryFormValues,
} from "./EntryForm";

type EntryPageProps = {
  cancelLabel?: string;
  date: string;
  errors?: Partial<Record<EntryFormFieldKey, string>>;
  errorMessage?: string;
  isLoading?: boolean;
  isSaving?: boolean;
  loadingMessage?: string;
  onCancel?: () => void;
  onDateChange: (value: string) => void;
  onFieldChange: (field: EntryFormFieldKey, value: string) => void;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  pageDescription?: string;
  saveLabel?: string;
  statusMessage?: string;
  title?: string;
  values: EntryFormValues;
};

export function EntryPage({
  cancelLabel,
  date,
  errors,
  errorMessage,
  isLoading = false,
  isSaving = false,
  loadingMessage = "Loading saved values for the selected day...",
  onCancel,
  onDateChange,
  onFieldChange,
  onSubmit,
  pageDescription = "Capture one day at a time with a calm, manual-first flow that stays ready for future connected sources.",
  saveLabel,
  statusMessage,
  title = "Manual Entry",
  values,
}: EntryPageProps) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <header className="grid gap-4 border-b border-border pb-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <p className="text-sm font-medium text-primary">BioTracker</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {pageDescription}
            </p>
          </div>

          <div className="rounded-md border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground md:max-w-xs">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Today&apos;s focus
            </p>
            <p className="mt-2 font-medium">
              Add only the measurements you have available.
            </p>
            <p className="mt-1 leading-6 text-muted-foreground">
              Empty fields can stay blank until later.
            </p>
          </div>
        </header>

        {isLoading ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-soft"
          >
            <LoaderCircle
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary"
            />
            <span>{loadingMessage}</span>
          </div>
        ) : null}

        {errorMessage ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {statusMessage ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-md border border-border bg-secondary px-4 py-3 text-sm text-secondary-foreground"
          >
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
            />
            <span>{statusMessage}</span>
          </div>
        ) : null}

        <EntryForm
          cancelLabel={cancelLabel}
          date={date}
          errors={errors}
          isLoading={isLoading}
          isSaving={isSaving}
          onCancel={onCancel}
          onDateChange={onDateChange}
          onFieldChange={onFieldChange}
          onSubmit={onSubmit}
          saveLabel={saveLabel}
          values={values}
        />
      </div>
    </main>
  );
}
