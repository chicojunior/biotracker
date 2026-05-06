export type DateKey = string;

export interface DateRange {
  start: DateKey;
  end: DateKey;
}

export type DateInput = Date | string;

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/;

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function formatLocalDateKey(date: Date): DateKey {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-');
}

function parseDateKeyParts(input: string): { year: number; monthIndex: number; day: number } {
  const match = DATE_KEY_PATTERN.exec(input);

  if (!match) {
    throw new Error(`Invalid date key: ${input}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error(`Invalid date key: ${input}`);
  }

  return { year, monthIndex: month - 1, day };
}

function fromDateKey(input: string): Date {
  const { year, monthIndex, day } = parseDateKeyParts(input);

  return new Date(year, monthIndex, day, 12);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
}

function getLocalNoonDate(input: DateInput): Date {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new Error('Invalid date');
    }

    return new Date(input.getFullYear(), input.getMonth(), input.getDate(), 12);
  }

  return fromDateKey(input);
}

function assertRangeOrder(range: DateRange): DateRange {
  const normalizedRange = {
    start: normalizeDateKey(range.start),
    end: normalizeDateKey(range.end),
  };

  if (compareDateKeys(normalizedRange.start, normalizedRange.end) > 0) {
    throw new Error(`Invalid date range: ${range.start} after ${range.end}`);
  }

  return normalizedRange;
}

export function normalizeDateKey(input: DateInput): DateKey {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new Error('Invalid date');
    }

    return formatLocalDateKey(input);
  }

  return formatLocalDateKey(fromDateKey(input));
}

export function compareDateKeys(left: DateKey, right: DateKey): number {
  const normalizedLeft = normalizeDateKey(left);
  const normalizedRight = normalizeDateKey(right);

  if (normalizedLeft < normalizedRight) {
    return -1;
  }

  if (normalizedLeft > normalizedRight) {
    return 1;
  }

  return 0;
}

export function getDayRange(date: DateInput): DateRange {
  const dateKey = normalizeDateKey(date);

  return { start: dateKey, end: dateKey };
}

export function getWeekRange(date: DateInput, weekStartsOn = 1): DateRange {
  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) {
    throw new Error(`Invalid week start: ${weekStartsOn}`);
  }

  const localDate = getLocalNoonDate(date);
  const daysFromStart = (localDate.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(localDate, -daysFromStart);
  const end = addDays(start, 6);

  return {
    start: formatLocalDateKey(start),
    end: formatLocalDateKey(end),
  };
}

export function getMonthRange(date: DateInput): DateRange {
  const localDate = getLocalNoonDate(date);
  const start = new Date(localDate.getFullYear(), localDate.getMonth(), 1, 12);
  const end = new Date(localDate.getFullYear(), localDate.getMonth() + 1, 0, 12);

  return {
    start: formatLocalDateKey(start),
    end: formatLocalDateKey(end),
  };
}

export function isDateKeyInRange(dateKey: DateKey, range: DateRange): boolean {
  const normalizedDateKey = normalizeDateKey(dateKey);
  const normalizedRange = assertRangeOrder(range);

  return (
    compareDateKeys(normalizedDateKey, normalizedRange.start) >= 0 &&
    compareDateKeys(normalizedDateKey, normalizedRange.end) <= 0
  );
}

export function enumerateDateKeysInRange(range: DateRange): DateKey[] {
  const normalizedRange = assertRangeOrder(range);
  const dateKeys: DateKey[] = [];
  let cursor = fromDateKey(normalizedRange.start);

  while (formatLocalDateKey(cursor) <= normalizedRange.end) {
    dateKeys.push(formatLocalDateKey(cursor));
    cursor = addDays(cursor, 1);
  }

  return dateKeys;
}

export function countMissingDateKeys(dateKeys: Iterable<DateKey>, range: DateRange): number {
  const presentDateKeys = new Set(Array.from(dateKeys, normalizeDateKey));

  return enumerateDateKeysInRange(range).filter((dateKey) => !presentDateKeys.has(dateKey)).length;
}
