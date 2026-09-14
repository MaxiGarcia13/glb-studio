import { cn } from '@maxigarcia/js-utils';

const variants: Record<Variant, string> = {
  ghost: 'text-zinc-400 hover:text-white transition-colors',
  default: 'text-white hover:text-zinc-400 transition-colors bg-zinc-600 hover:bg-zinc-700',
  primary: 'text-white bg-sky-500 hover:bg-sky-600',
};

type Variant = 'ghost' | 'default' | 'primary';

interface ButtonProps extends React.ComponentPropsWithRef<'button'> {
  variant?: Variant;
}

export function Button({
  className,
  children,
  variant = 'default',
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
        event.stopPropagation();
      }}
      className={
        cn(
          'text-xs transition-colors rounded-sm p-2',
          disabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${variants[variant]}`,
          className,
        )
      }
      {...props}
    >
      {children}
    </button>
  );
}
