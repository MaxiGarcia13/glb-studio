import { cn } from '@maxigarcia/js-utils';
import { useId } from 'react';
import { Text } from '@/components/text';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.ComponentPropsWithRef<'select'>, 'children'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  options,
  placeholder,
  className,
  id: idProp,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;

  const select = (
    <select
      id={id}
      className={
        cn(
          'bg-control rounded-sm px-2 py-2 text-xs text-fg disabled:opacity-50',
          className,
        )
      }
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (!label) {
    return select;
  }

  return (
    <label className="flex flex-1 flex-col gap-2" htmlFor={id}>
      <Text variant="muted">{label}</Text>
      {select}
    </label>
  );
}
