import { cn } from '@maxigarcia/js-utils';
import { SaveKeyframeButton } from '@/modules/animation';
import { ModelToolBar } from '@/modules/create/components/model-tool-bar';
import { EditToolToolbar } from '@/modules/viewport/components/edit-tool-toolbar';
import { SelectionNameOverlay } from '@/modules/viewport/components/selection-name-overlay';
import { TransformModeToolbar } from '@/modules/viewport/components/transform-mode-toolbar';
import { ViewportCanvas } from '@/modules/viewport/components/viewport-canvas';
import { ViewportStatusOverlay } from '@/modules/viewport/components/viewport-status-overlay';
import { isMobileViewport } from '@/utils/device';
import { PreviewPlaybackBar } from './preview-playback-bar';

export function EditorPreview() {
  const isMobile = isMobileViewport();

  return (
    <div className="relative flex-1 flex flex-col min-w-0 h-full bg-zinc-900">
      <div className="relative flex-1 min-h-0">
        <ViewportCanvas />
        <ViewportStatusOverlay />

        <div className={
          cn(
            'pointer-events-none absolute inset-x-0 z-10 flex justify-center px-4',
            isMobile ? 'top-16' : 'top-4',
          )
        }
        >
          <TransformModeToolbar />
        </div>
        <div className={cn(
          'pointer-events-none absolute z-10 flex right-2  justify-end pr-4',
          isMobile ? 'bottom-16' : 'bottom-4',
        )}
        >
          <SelectionNameOverlay />
        </div>

        <ModelToolBar />

        <div className={
          cn(
            'pointer-events-none absolute inset-x-0 z-10 flex left-4 justify-center',
            'bottom-18',
          )
        }
        >
          <SaveKeyframeButton />
        </div>

        <div className="pointer-events-none absolute z-10 flex left-4 bottom-4">
          <EditToolToolbar />
        </div>
      </div>

      <PreviewPlaybackBar />
    </div>
  );
}
