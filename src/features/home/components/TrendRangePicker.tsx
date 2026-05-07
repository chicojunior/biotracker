import { SegmentedControl } from '../../settings/components/SegmentedControl';

export type TrendRangePreset = '7d' | '30d' | '90d';

export type TrendRangePickerProps = {
  value: TrendRangePreset;
  onChange: (next: TrendRangePreset) => void;
};

const OPTIONS: { value: TrendRangePreset; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
];

export function TrendRangePicker({ value, onChange }: TrendRangePickerProps): JSX.Element {
  return (
    <SegmentedControl<TrendRangePreset>
      legend="Período"
      description="Selecione a janela de tempo das tendências."
      options={OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
