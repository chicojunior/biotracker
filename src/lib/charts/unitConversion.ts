export type UnitConversionResult = {
  value: number;
  converted: boolean;
  warning?: string;
};

type ConversionKey = `${string}->${string}`;

const CONVERSION_FACTORS: Record<ConversionKey, number> = {
  'lb->kg': 0.45359237,
  'lbs->kg': 0.45359237,
  'min->h': 1 / 60,
  'sec->h': 1 / 3600,
  's->h': 1 / 3600,
};

export function convertToMetric(
  value: number,
  fromUnit: string | null | undefined,
  toUnit: string,
): UnitConversionResult {
  if (fromUnit == null) {
    return { value, converted: false };
  }

  const from = fromUnit.toLowerCase();
  const to = toUnit.toLowerCase();

  if (from === to) {
    return { value, converted: false };
  }

  const key: ConversionKey = `${from}->${to}`;
  const factor = CONVERSION_FACTORS[key];

  if (factor !== undefined) {
    return { value: value * factor, converted: true };
  }

  return {
    value,
    converted: false,
    warning: `Unknown unit '${fromUnit}' for target '${toUnit}'; passing through unchanged`,
  };
}
