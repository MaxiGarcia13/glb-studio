import { cn } from '@maxigarcia/js-utils';

const variants: Record<Variant, string> = {
  ghost: 'text-fg-muted hover:text-fg transition-colors',
  default: 'text-fg hover:text-fg-muted transition-colors bg-control-strong hover:bg-surface-hover',
  primary: 'text-accent-fg bg-accent hover:bg-accent-hover',
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
          disabled ? 'text-fg-disabled cursor-not-allowed' : `cursor-pointer ${variants[variant]}`,
          className,
        )
      }
      {...props}
    >
      {children}
    </button>
  );
}
