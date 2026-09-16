import { cn } from '@maxigarcia/js-utils';
import { useId } from 'react';
import { Text } from '@/components/text';

interface InputProps extends React.ComponentPropsWithRef<'input'> {
  label: string;
}

export function Input({ label, className, ...props }: InputProps) {
  const id = useId();

  return (
    <label className="flex flex-1 flex-col gap-2" htmlFor={id}>
      <Text variant="muted">{label}</Text>
      <input
        id={id}
        className={
          cn(
            'bg-control rounded-sm px-2 py-2 text-xs text-fg disabled:opacity-50',
            className,
          )
        }
        {...props}
      />
    </label>
  );
}
