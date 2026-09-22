import { cn } from '@maxigarcia/js-utils';
import { FloatingToolbar } from '@/components/floating-toolbar';
import { useIsCreatedModelFocused } from '../hooks/use-selected-created-part';
import { AddPartPalette } from './add-part-palette';
import { PartColorTool } from './part-color-tool';
import { PartDeleteTool } from './part-delete-tool';
import { PartDuplicateTool } from './part-duplicate-tool';
import { PartTextureTool } from './part-texture-tool';

interface CreateToolbarProps {
  className?: string;
}

export function CreateToolbar({ className }: CreateToolbarProps) {
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
      <PartTextureTool />
      <PartDuplicateTool />
      <PartDeleteTool />
    </FloatingToolbar>
  );
}
