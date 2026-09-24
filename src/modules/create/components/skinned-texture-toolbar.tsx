import { cn } from '@maxigarcia/js-utils';
import { FloatingToolbar } from '@/components/floating-toolbar';
import { useIsSkinnedLibraryModelFocused } from '../hooks/use-skinned-texture';
import { SkinnedTextureTool } from './skinned-texture-tool';

interface SkinnedTextureToolbarProps {
  className?: string;
}

/** Compact texture control for skinned library focus. No prep modal. */
export function SkinnedTextureToolbar({ className }: SkinnedTextureToolbarProps) {
  const isFocused = useIsSkinnedLibraryModelFocused();

  if (!isFocused) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      <FloatingToolbar aria-label="Skinned texture">
        <SkinnedTextureTool />
      </FloatingToolbar>
    </div>
  );
}
