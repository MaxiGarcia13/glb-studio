import { debounce } from '@maxigarcia/js-utils';

import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/button';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import { useActiveModel } from '@/modules/viewport/hooks/use-active-model';
import {
  $clips,
  bakeBlend,
  isReadyClip,
  MAX_BLEND_WEIGHT,
  resetBlend,
  setBlendClip,
  setBlendWeight,
} from '../stores/clip-store';

const BLEND_WEIGHT_DEBOUNCE_MS = 150;

export function BlendControls() {
  const {
    clips,
    activeClipId,
    blendClipId,
    blendWeight,
  } = useStore($clips, {
    keys: ['clips', 'activeClipId', 'blendClipId', 'blendWeight'],
  });
  const { scene } = useActiveModel();
  const [draftWeight, setDraftWeight] = useState(blendWeight);
  const commitWeight = useRef(
    debounce((weight: number) => {
      setBlendWeight(weight);
    }, BLEND_WEIGHT_DEBOUNCE_MS),
  ).current;

  useEffect(() => {
    setDraftWeight($clips.get().blendWeight);
  }, [blendClipId, blendWeight]);

  const activeEntry = clips.find((entry) => entry.id === activeClipId);
  const canBlend = scene !== null && isReadyClip(activeEntry);
  const blendOptions = clips.filter(
    (entry) => isReadyClip(entry) && entry.id !== activeClipId,
  );
  const blendEnabled = canBlend && blendClipId !== null;
  const canBake = blendEnabled && blendWeight > 0;
  const canReset = blendClipId !== null || blendWeight > 0;

  if (!canBlend) {
    return (
      <Text as="p" variant="muted">
        Select an animation to blend with another clip.
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Blend Clip"
        value={blendClipId ?? ''}
        onChange={(event) => setBlendClip(event.target.value || null)}
        placeholder="None"
        options={blendOptions.map((entry) => ({
          value: entry.id,
          label: entry.name,
        }))}
      />

      <label className="flex flex-col gap-2">
        <Text variant="muted">Blend Weight</Text>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={MAX_BLEND_WEIGHT}
            step={0.01}
            value={draftWeight}
            onChange={(event) => {
              const next = Number(event.currentTarget.value);
              setDraftWeight(next);
              void commitWeight(next);
            }}
            disabled={!blendEnabled}
            aria-label="Blend weight"
            className="flex-1 accent-accent disabled:opacity-40"
          />
          <Text variant="numeric" className="w-8 text-right text-fg">
            {Math.round(draftWeight * 100)}
            %
          </Text>
        </div>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => resetBlend()}
          disabled={!canReset}
          variant="ghost"
          className="px-4 flex-1"
        >
          Reset
        </Button>
        <Button
          onClick={() => bakeBlend()}
          disabled={!canBake}
          variant="primary"
          className="px-4 flex-1"
        >
          Bake
        </Button>
      </div>
    </div>
  );
}
