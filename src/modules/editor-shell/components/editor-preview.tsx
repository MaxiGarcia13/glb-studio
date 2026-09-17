import { cn } from '@maxigarcia/js-utils';
import { RestorePoseButton } from '@/modules/animation';
import { CreateToolbar } from '@/modules/create/components/create-toolbar';
import { useIsCreatedModelFocused } from '@/modules/create/hooks/use-selected-created-part';
import { EditMoveToolbar } from '@/modules/viewport/components/edit-move-toolbar';
import { SelectionNameOverlay } from '@/modules/viewport/components/selection-name-overlay';
import { TransformModeToolbar } from '@/modules/viewport/components/transform-mode-toolbar';
import { ViewportCanvas } from '@/modules/viewport/components/viewport-canvas';
import { ViewportStatusOverlay } from '@/modules/viewport/components/viewport-status-overlay';
import { isMobileViewport } from '@/utils/device';
import { PreviewPlaybackBar } from './preview-playback-bar';

export function EditorPreview() {
  const isMobile = isMobileViewport();
  const createFocused = useIsCreatedModelFocused();

  return (
    <div className="relative flex-1 flex flex-col min-w-0 h-full bg-canvas">
      <div className="relative flex-1 min-h-0">
        <ViewportCanvas />
        <ViewportStatusOverlay />

        {/* Below Library / Settings open chips on mobile (chips sit at top-4). */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 z-10 flex justify-center px-4',
            isMobile ? 'top-20' : 'top-4',
          )}
        >
          <TransformModeToolbar />
        </div>

        <div
          className={cn(
            'pointer-events-none absolute z-10 flex right-4 justify-end',
            isMobile ? 'bottom-28' : 'bottom-4',
          )}
        >
          <SelectionNameOverlay />
        </div>

        {/* Create tools: bottom center. Edit stacks above them on mobile. */}
        <div
          className={cn(
            'pointer-events-none absolute z-10 flex left-1/2 -translate-x-1/2',
            'bottom-4',
          )}
        >
          <CreateToolbar />
        </div>

        <div
          className={cn(
            'pointer-events-none absolute z-10 flex',
            isMobile
              ? cn(
                  'left-1/2 -translate-x-1/2',
                  createFocused ? 'bottom-18' : 'bottom-4',
                )
              : 'left-4 bottom-4',
          )}
        >
          <EditMoveToolbar />
        </div>

        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 z-10 flex justify-center px-4',
            isMobile ? 'bottom-32' : 'bottom-18',
          )}
        >
          <RestorePoseButton />
        </div>
      </div>

      <PreviewPlaybackBar />
    </div>
  );
}
