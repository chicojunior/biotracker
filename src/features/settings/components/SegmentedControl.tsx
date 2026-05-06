type SegmentedOption<Value extends string> = {
  description?: string;
  label: string;
  value: Value;
};

type SegmentedControlProps<Value extends string> = {
  description?: string;
  legend: string;
  onChange: (value: Value) => void;
  options: SegmentedOption<Value>[];
  value: Value;
};

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SegmentedControl<Value extends string>({
  description,
  legend,
  onChange,
  options,
  value,
}: SegmentedControlProps<Value>) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="mt-3 grid gap-2 sm:grid-cols-3" role="group">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
              className={joinClasses(
                "min-h-12 rounded-md border px-3 py-2 text-left text-sm transition",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-foreground hover:border-primary/70 hover:bg-secondary",
              )}
            >
              <span className="block font-medium">{option.label}</span>
              {option.description ? (
                <span
                  className={joinClasses(
                    "mt-0.5 block text-xs leading-5",
                    isSelected
                      ? "text-primary-foreground/85"
                      : "text-muted-foreground",
                  )}
                >
                  {option.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
