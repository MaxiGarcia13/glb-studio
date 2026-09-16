import type { PartSizeParamKey } from '@/modules/create/types/part';
import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/input/input';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import { $activeModel } from '@/modules/viewport/stores/model-store';
import {
  parentSelectedPart,
  PARTS_ROOT_PARENT_VALUE,
} from '../actions/parent-selected-part';
import {
  currentParentId,
  listParentCandidates,
} from '../domain/parent-part';
import { readCreatePart } from '../domain/part-data';
import { setPartSizeParam } from '../domain/part-kind';
import { useSelectedCreatedPart } from '../hooks/use-selected-created-part';

function formatSize(value: number, integer?: boolean): string {
  if (!Number.isFinite(value)) {
    return '';
  }
  if (integer) {
    return String(Math.round(value));
  }
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded);
}

function fieldLabel(label: string, unit: 'm' | null = 'm'): string {
  return unit === null ? label : `${label} (${unit})`;
}

function paramValue(
  params: Record<string, number>,
  param: PartSizeParamKey,
): number | undefined {
  const value = params[param];
  return typeof value === 'number' ? value : undefined;
}

/**
 * Settings-side size + parent fields for a selected created part.
 * Color lives on the create toolbar.
 */
export function PartInspector() {
  const part = useSelectedCreatedPart();
  const activeModel = useStore($activeModel);
  const meshId = part?.mesh.uuid ?? null;
  const [draft, setDraft] = useState<Partial<Record<PartSizeParamKey, string>>>({});
  // Hierarchy mutates the Object3D tree; bump so parent select refreshes.
  const [hierarchyEpoch, setHierarchyEpoch] = useState(0);

  useEffect(() => {
    if (!part || !meshId) {
      setDraft({});
      return;
    }

    const next: Partial<Record<PartSizeParamKey, string>> = {};
    for (const field of part.kind.sizeFields) {
      const value = paramValue(
        part.record.params as Record<string, number>,
        field.param,
      );
      next[field.param]
        = value === undefined ? '' : formatSize(value, field.integer);
    }

    setDraft(next);
  }, [meshId]);

  if (!part) {
    return null;
  }

  const partsRoot
    = activeModel?.source === 'created' ? activeModel.scene : null;
  void hierarchyEpoch;

  const parentOptions = partsRoot
    ? [
        { value: PARTS_ROOT_PARENT_VALUE, label: 'Model root' },
        ...listParentCandidates(part.mesh, partsRoot)
          .map((candidate) => ({
            value: candidate.uuid,
            label: candidate.name || candidate.uuid,
          }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ]
    : [];

  const parentValue = partsRoot
    ? (currentParentId(part.mesh, partsRoot) ?? PARTS_ROOT_PARENT_VALUE)
    : PARTS_ROOT_PARENT_VALUE;

  const handleChange = (param: PartSizeParamKey, next: string, min: number) => {
    setDraft((current) => ({ ...current, [param]: next }));
    if (next === '' || next === '-' || next === '.' || next === '-.') {
      return;
    }
    const parsed = Number(next);
    if (!Number.isFinite(parsed) || parsed < min) {
      return;
    }
    setPartSizeParam(part.mesh, param, parsed);
  };

  const handleBlur = (param: PartSizeParamKey) => {
    const record = readCreatePart(part.mesh);
    const field = part.kind.sizeFields.find((entry) => entry.param === param);
    const value = record
      ? paramValue(record.params as Record<string, number>, param)
      : undefined;
    setDraft((current) => ({
      ...current,
      [param]:
        value === undefined ? '' : formatSize(value, field?.integer),
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      <Text as="h2" variant="section">
        Part ·
        {' '}
        {part.kind.label}
      </Text>

      <div className="flex flex-col gap-2">
        <Text variant="muted">Size</Text>
        <div className="flex flex-wrap gap-2">
          {part.kind.sizeFields.map((field) => (
            <Input
              key={field.param}
              label={fieldLabel(field.label, field.unit)}
              type="number"
              step={field.step ?? 0.01}
              min={field.min}
              value={draft[field.param] ?? ''}
              className="min-w-20 flex-1"
              onChange={(event) =>
                handleChange(field.param, event.target.value, field.min)}
              onBlur={() => handleBlur(field.param)}
            />
          ))}
        </div>
      </div>

      {partsRoot && (
        <Select
          label="Parent"
          value={parentValue}
          options={parentOptions}
          onChange={(event) => {
            if (parentSelectedPart(event.target.value)) {
              setHierarchyEpoch((epoch) => epoch + 1);
            }
          }}
        />
      )}
    </div>
  );
}
