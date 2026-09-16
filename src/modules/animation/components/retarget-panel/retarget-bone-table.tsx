import { Text } from '@/components/text';
import { RetargetBoneRow } from './retarget-bone-row';
import { RETARGET_ROW_GRID } from './retarget-row-grid';

interface RetargetBoneTableProps {
  rows: string[];
  mapping: Map<string, string>;
  targetBoneNames: Set<string>;
  sortedTargets: string[];
  onMap: (sourceBone: string, value: string) => void;
}

export function RetargetBoneTable({
  rows,
  mapping,
  targetBoneNames,
  sortedTargets,
  onMap,
}: RetargetBoneTableProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto rounded-sm border border-border/80">
      <div
        className={`${RETARGET_ROW_GRID} sticky top-0 z-10 bg-surface px-4 py-2 border-b border-border`}
      >
        <Text variant="section">Clip bone</Text>
        <span aria-hidden />
        <Text variant="section">Character bone</Text>
        <Text variant="section" className="text-right">
          Status
        </Text>
      </div>

      <div className="flex flex-col px-4 py-2">
        {rows.length === 0
          ? (
              <Text variant="muted" className="py-2">
                All bones are mapped.
              </Text>
            )
          : rows.map((sourceBone) => {
              const target = mapping.get(sourceBone);
              const isMapped = Boolean(target && targetBoneNames.has(target));
              return (
                <RetargetBoneRow
                  key={sourceBone}
                  sourceBone={sourceBone}
                  target={target}
                  isMapped={isMapped}
                  sortedTargets={sortedTargets}
                  targetBoneNames={targetBoneNames}
                  onMap={onMap}
                />
              );
            })}
      </div>
    </div>
  );
}
