import type { ResizableAxis, ResizableEdge } from './use-resizable-size';
import type { StorageKey } from '@/utils/local-storage';
import { cn } from '@maxigarcia/js-utils';
import { useResizableSize } from './use-resizable-size';

export interface ResizableShellProps {
  'children': React.ReactNode;
  'axis': ResizableAxis;
  'edge': ResizableEdge;
  'storageKey': StorageKey;
  'defaultSize': number;
  'minSize': number;
  'maxSize': number;
  'enabled'?: boolean;
  'getMaxSize'?: () => number;
  'className'?: string;
  'aria-label'?: string;
}

/**
 * Flex shell with a drag handle on one edge. Persists size via localStorage.
 */
export function ResizableShell({
  children,
  axis,
  edge,
  storageKey,
  defaultSize,
  minSize,
  maxSize,
  enabled = true,
  getMaxSize,
  className,
  'aria-label': ariaLabel = 'Resize panel',
}: ResizableShellProps) {
  const { size, onHandlePointerDown } = useResizableSize({
    axis,
    edge,
    storageKey,
    defaultSize,
    minSize,
    maxSize,
    enabled,
    getMaxSize,
  });

  const sizeStyle
    = axis === 'horizontal'
      ? { width: size }
      : { height: size };

  const handleClassName = cn(
    'absolute z-10 touch-none',
    'bg-transparent hover:bg-border focus-visible:bg-border',
    axis === 'horizontal' && 'top-0 h-full w-2 cursor-ew-resize',
    axis === 'horizontal' && edge === 'end' && 'right-0',
    axis === 'horizontal' && edge === 'start' && 'left-0',
    axis === 'vertical' && 'left-0 w-full h-2 cursor-ns-resize',
    axis === 'vertical' && edge === 'end' && 'bottom-0',
    axis === 'vertical' && edge === 'start' && 'top-0',
  );

  return (
    <div
      className={cn('relative flex flex-col shrink-0', className)}
      style={sizeStyle}
    >
      {children}
      {enabled && (
        <div
          role="separator"
          aria-label={ariaLabel}
          aria-orientation={axis === 'horizontal' ? 'vertical' : 'horizontal'}
          aria-valuenow={Math.round(size)}
          aria-valuemin={minSize}
          aria-valuemax={maxSize}
          tabIndex={0}
          className={handleClassName}
          onPointerDown={onHandlePointerDown}
        />
      )}
    </div>
  );
}
