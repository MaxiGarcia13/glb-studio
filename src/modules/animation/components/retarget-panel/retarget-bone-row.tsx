import { Text } from '@/components/text';
import {
  boneDisplayName,
  boneOptionLabel,
} from '@/modules/animation/domain/bone-registry';
import { RETARGET_ROW_GRID } from './retarget-row-grid';

interface RetargetBoneRowProps {
  sourceBone: string;
  target: string | undefined;
  isMapped: boolean;
  sortedTargets: string[];
  targetBoneNames: Set<string>;
  onMap: (sourceBone: string, value: string) => void;
}

export function RetargetBoneRow({
  sourceBone,
  target,
  isMapped,
  sortedTargets,
  targetBoneNames,
  onMap,
}: RetargetBoneRowProps) {
  const sourceLabel = boneDisplayName(sourceBone);

  return (
    <div
      className={`${RETARGET_ROW_GRID} py-2 border-b border-border/50 last:border-b-0`}
    >
      <Text className="truncate" title={sourceBone}>
        {sourceLabel}
      </Text>
      <Text variant="muted" className="text-center" aria-hidden>
        →
      </Text>
      <select
        value={target ?? ''}
        onChange={(event) => onMap(sourceBone, event.target.value)}
        aria-label={`Map ${sourceLabel} (${sourceBone}) to character bone`}
        className={
          `w-full min-w-0 bg-control rounded-sm px-2 py-2 text-xs text-fg ${
            isMapped ? '' : 'ring-1 ring-warning/60'
          }`
        }
      >
        <option value="">— map to —</option>
        {sortedTargets.map((targetName) => (
          <option key={targetName} value={targetName}>
            {boneOptionLabel(targetName, targetBoneNames)}
          </option>
        ))}
      </select>
      <Text
        variant="muted"
        className={`text-right tabular-nums ${isMapped ? '' : 'text-warning'}`}
      >
        {isMapped ? 'Mapped' : 'Will skip'}
      </Text>
    </div>
  );
}
