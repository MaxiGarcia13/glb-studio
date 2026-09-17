import type { RefObject } from 'react';

import { Text } from '@/components/text';

interface TimelinePlayheadProps {
  playheadRef: RefObject<HTMLDivElement | null>;
  frameLabelRef: RefObject<HTMLSpanElement | null>;
}

export function TimelinePlayhead({ playheadRef, frameLabelRef }: TimelinePlayheadProps) {
  return (
    <div
      ref={playheadRef}
      className="pointer-events-none absolute top-0 bottom-0 left-0 z-1 w-0"
    >
      <div className="absolute top-0 left-1/2 flex -translate-x-1/2 flex-col items-center">
        <Text variant="numeric" className="rounded-sm bg-accent px-2 py-0.5 font-medium text-accent-fg">
          <span ref={frameLabelRef}>1</span>
        </Text>
        <span className="h-0 w-0 border-x-[5px] border-t-[5px] border-x-transparent border-t-accent" />
      </div>
      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-accent" />
    </div>
  );
}
