import type { StorageKey } from '@/utils/local-storage';
import { cn } from '@maxigarcia/js-utils';
import { useState } from 'react';
import { ResizableShell } from '@/components/resizable-shell';
import { isMobileViewport } from '@/utils/device';
import { AsideHeader } from './aside-header';
import { OpenButton } from './open-button';

const ASIDE_DEFAULT_WIDTH = 288;
const ASIDE_MIN_WIDTH = 240;
const ASIDE_MAX_WIDTH = 560;

interface CollapsibleAsideProps {
  children: React.ReactNode;
  title: string;
  direction: 'left' | 'right';
  storageKey: StorageKey;
  className?: string;
  contentClassName?: string;
}

export function CollapsibleAside({
  children,
  direction,
  title,
  storageKey,
  className,
  contentClassName,
}: CollapsibleAsideProps) {
  const isMobile = isMobileViewport();

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const { borderDirection }
    = direction === 'left'
      ? {
          borderDirection: 'border-r',
        }
      : {
          borderDirection: 'border-l',
        };

  if (!sidebarOpen) {
    return (
      <OpenButton
        direction={direction}
        onToggle={toggleSidebar}
        title={title}
      />
    );
  }

  return (
    <ResizableShell
      axis="horizontal"
      edge={direction === 'left' ? 'end' : 'start'}
      storageKey={storageKey}
      defaultSize={ASIDE_DEFAULT_WIDTH}
      minSize={ASIDE_MIN_WIDTH}
      maxSize={ASIDE_MAX_WIDTH}
      enabled={!isMobile}
      aria-label={`Resize ${title} sidebar`}
      className={cn(
        'bg-surface border-border',
        borderDirection,
        isMobile && `absolute z-20 h-full ${direction === 'left' ? 'left-0' : 'right-0'}`,
        className,
      )}
    >
      <AsideHeader
        direction={direction}
        onToggle={toggleSidebar}
        title={title}
      />

      <div className={cn('flex-1 overflow-y-auto p-4 flex flex-col gap-6', contentClassName)}>
        {children}
      </div>
    </ResizableShell>
  );
}
