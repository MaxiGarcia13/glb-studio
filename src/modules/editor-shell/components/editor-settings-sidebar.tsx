import { Collapsible, CollapsibleContent, CollapsibleHeader } from '@/components/collapsible';
import { CollapsibleAside } from '@/components/collapsible-aside/collapsible-aside';
import { Text } from '@/components/text';
import { BlendControls, ClipTrimInputs, SpeedControl } from '@/modules/animation';
import { DownloadExport } from './download-export';
import { TransformReadout } from './transform-readout';
import { WorldAxesControls } from './world-axes-controls';

export function EditorSettingsSidebar() {
  return (
    <CollapsibleAside
      title="Settings"
      direction="right"
      className="flex flex-col gap-6"
      contentClassName="pt-0"
    >
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Text as="h2" variant="section">
            Axes
          </Text>
          <WorldAxesControls />

          <TransformReadout />
        </div>

        <Text as="h2" variant="section">
          Animation
        </Text>

        <div className="flex flex-col gap-4">
          <ClipTrimInputs />
          <SpeedControl />

          <Collapsible className="gap-2">
            <CollapsibleHeader title="Blend" />
            <CollapsibleContent className="gap-4">
              <BlendControls />
            </CollapsibleContent>
          </Collapsible>

        </div>
      </div>

      <DownloadExport />
    </CollapsibleAside>
  );
}
