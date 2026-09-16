import { cn } from '@maxigarcia/js-utils';
import { FloatingToolbar } from '@/components/floating-toolbar';
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
    <FloatingToolbar
      aria-label="Create tools"
      className={cn(className)}
    >
      <AddPartPalette />
      <div className="mx-2 h-6 w-px bg-border" aria-hidden />
      <PartColorTool />
      <PartDuplicateTool />
      <PartDeleteTool />
    </FloatingToolbar>
  );
}
