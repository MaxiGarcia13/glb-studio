import { cn } from '@maxigarcia/js-utils';
import { useIsCreatedModelFocused } from '../hooks/use-selected-created-part';
import { AddPartPalette } from './add-part-palette';
import { PartColorTool } from './part-color-tool';
import { PartDeleteTool } from './part-delete-tool';
import { PartDuplicateTool } from './part-duplicate-tool';

interface ModelToolBarProps {
  className?: string;
}

export function ModelToolBar({ className }: ModelToolBarProps) {
  const isFocused = useIsCreatedModelFocused();

  if (!isFocused) {
    return null;
  }

  return (
    <section
      role="toolbar"
      aria-label="Create tools"
      className={cn(
        'flex items-center gap-1 p-1',
        'absolute bottom-4 left-1/2',
        'rounded-sm bg-zinc-800/90',
        className,
      )}
    >
      <AddPartPalette />
      <div className="mx-1 h-6 w-0.5 bg-zinc-700" aria-hidden />
      <PartColorTool />
      <PartDuplicateTool />
      <PartDeleteTool />
    </section>
  );
}
