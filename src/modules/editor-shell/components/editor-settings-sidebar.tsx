import { useStore } from '@nanostores/react';
import { Collapsible, CollapsibleContent, CollapsibleHeader } from '@/components/collapsible';
import { CollapsibleAside } from '@/components/collapsible-aside/collapsible-aside';
import { Text } from '@/components/text';
import {
  BlendControls,
  ClipTrimInputs,
  KeyframeEditor,
  SpeedControl,
} from '@/modules/animation';
import { PartInspector } from '@/modules/create/components/part-inspector';
import { $settingsFocus } from '@/modules/viewport/stores/transform-readout-store';
import { SelectionNameField } from './selection-name-field';
import { TransformReadout } from './transform-readout';

export function EditorSettingsSidebar() {
  const focus = useStore($settingsFocus);
  const showModel = focus.kind === 'idle' || focus.kind === 'group';
  const showPart = focus.kind === 'part';
  const showAnimation = focus.kind === 'idle' || focus.kind === 'bone';
  const showSelection = focus.kind !== 'multi';

  return (
    <CollapsibleAside
      title="Settings"
      direction="right"
      className="flex flex-col gap-6"
      contentClassName="pt-0"
    >
      <div className="flex-1 flex flex-col gap-6">
        {showModel && (
          <div className="flex flex-col gap-4">
            <Text as="h2" variant="section">
              Model
            </Text>
            <TransformReadout />
          </div>
        )}

        {showSelection && <SelectionNameField />}

        {showPart && <PartInspector />}

        {showAnimation && (
          <>
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

              <Collapsible className="gap-2" defaultOpen>
                <CollapsibleHeader title="Keys" />
                <CollapsibleContent className="gap-4">
                  <KeyframeEditor />
                </CollapsibleContent>
              </Collapsible>
            </div>
          </>
        )}
      </div>
    </CollapsibleAside>
  );
}
