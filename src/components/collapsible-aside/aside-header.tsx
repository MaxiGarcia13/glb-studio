import { Button } from '@/components/button';
import { ChevronLeft } from '@/components/icons/chevron-left-icon';
import { ChevronRight } from '@/components/icons/chevron-right-icon';
import { Text } from '@/components/text';

interface AsideHeaderProps {
  direction: 'left' | 'right';
  className?: string;
  title: string;
  onToggle: () => void;
}

export function AsideHeader({ direction, title, onToggle }: AsideHeaderProps) {
  const ariaLabel = `Collapse ${title} sidebar`;

  if (direction === 'left') {
    return (
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <Text size="sm" variant="heading">{title}</Text>
        <Button
          onClick={onToggle}
          aria-label={ariaLabel}
          variant="ghost"
        >
          <ChevronLeft />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
      <Button
        onClick={onToggle}
        aria-label={ariaLabel}
        variant="ghost"
      >
        <ChevronRight />
      </Button>
      <Text size="sm" variant="heading">{title}</Text>
    </div>
  );
}
