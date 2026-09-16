import { Button } from '../button';
import { FloatingToolbar } from '../floating-toolbar';
import { ChevronLeft } from '../icons/chevron-left-icon';
import { ChevronRight } from '../icons/chevron-right-icon';
import { Text } from '../text';

interface OpenButtonProps {
  direction: 'left' | 'right';
  onToggle: () => void;
  title: string;
}

export function OpenButton({ direction, onToggle, title }: OpenButtonProps) {
  const ariaLabel = `Expand ${title} sidebar`;

  if (direction === 'left') {
    return (
      <FloatingToolbar
        aria-label={ariaLabel}
        className="absolute top-12 z-10 left-4"
      >
        <Button
          onClick={onToggle}
          variant="ghost"
          aria-label={ariaLabel}
          className="flex items-center gap-2"
        >
          <Text size="sm" variant="heading">{title}</Text>
          <ChevronRight aria-hidden />
        </Button>
      </FloatingToolbar>
    );
  }

  return (
    <FloatingToolbar
      aria-label={ariaLabel}
      className="absolute top-12 z-10 right-4"
    >
      <Button
        onClick={onToggle}
        variant="ghost"
        aria-label={ariaLabel}
        className="flex items-center gap-2"
      >
        <ChevronLeft aria-hidden />
        <Text size="sm" variant="heading">{title}</Text>
      </Button>
    </FloatingToolbar>
  );
}
