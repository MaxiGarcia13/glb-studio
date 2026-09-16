import { Button } from '../button';
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
      <Button
        onClick={onToggle}
        aria-label={ariaLabel}
        className="absolute top-3 z-1 left-3 flex items-center gap-2"
      >
        <Text size="sm" variant="heading">{title}</Text>

        <ChevronRight />
      </Button>
    );
  }

  return (
    <Button
      onClick={onToggle}
      aria-label={ariaLabel}
      className="absolute top-3 z-1 right-3 flex items-center gap-2"
    >
      <ChevronLeft />

      <Text size="sm" variant="heading">{title}</Text>
    </Button>
  );
}
