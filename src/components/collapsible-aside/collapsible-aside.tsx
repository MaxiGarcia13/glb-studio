import { cn } from '@maxigarcia/js-utils';
import { useState } from 'react';
import { isMobileViewport } from '@/utils/device';
import { AsideHeader } from './aside-header';
import { OpenButton } from './open-button';

const SIDEBAR_WIDTH = '18rem';

interface CollapsibleAsideProps {
  children: React.ReactNode;
  title: string;
  direction: 'left' | 'right';
  className?: string;
  contentClassName?: string;
}

export function CollapsibleAside({
  children,
  direction,
  title,
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
    <aside
      className={
        cn(
          'flex flex-col shrink-0 bg-surface border-l border-border',
          borderDirection,
          isMobile && `absolute z-20 h-full ${direction === 'left' ? 'left-0' : 'right-0'}`,
          className,
        )
      }
      style={{ width: SIDEBAR_WIDTH }}
    >
      <AsideHeader
        direction={direction}
        onToggle={toggleSidebar}
        title={title}
      />

      <div className={cn('flex-1 overflow-y-auto p-4 flex flex-col gap-6', contentClassName)}>
        {children}
      </div>
    </aside>
  );
}
