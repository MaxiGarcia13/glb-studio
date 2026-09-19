import type { ExportFormat } from '@/modules/export/utils/file-name';
import type { ModelEntry } from '@/modules/viewport/types/model';
import type { ModelGroup } from '@/modules/viewport/types/model-group';

import { Input } from '@/components/input/input';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import { stripGlbExtension } from '@/modules/export/utils/file-name';

interface ExportUnitLike {
  kind: 'group' | 'single';
  group: ModelGroup | null;
  models: ModelEntry[];
}

interface ExportFileNamesProps {
  format: ExportFormat;
  busy: boolean;
  zipBaseName: string;
  groupBaseNames: Record<string, string>;
  modelBaseNames: Record<string, string>;
  multiModelGroups: ExportUnitLike[];
  exportUnits: ExportUnitLike[];
  onFormatChange: (format: ExportFormat) => void;
  onZipBaseNameChange: (value: string) => void;
  onGroupBaseNameChange: (groupId: string, value: string) => void;
  onModelBaseNameChange: (modelId: string, value: string) => void;
}

const FORMAT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'glb', label: 'GLB' },
  { value: 'fbx', label: 'FBX' },
];

export function ExportFileNames({
  format,
  busy,
  zipBaseName,
  groupBaseNames,
  modelBaseNames,
  multiModelGroups,
  exportUnits,
  onFormatChange,
  onZipBaseNameChange,
  onGroupBaseNameChange,
  onModelBaseNameChange,
}: ExportFileNamesProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4">
      <Text as="h2" variant="section">
        File names
      </Text>
      <Select
        label="Format"
        value={format}
        options={FORMAT_OPTIONS}
        disabled={busy}
        onChange={(event) => {
          const next = event.target.value;
          if (next === 'glb' || next === 'fbx') {
            onFormatChange(next);
          }
        }}
      />
      <Input
        label="Zip archive"
        value={zipBaseName}
        onChange={(event) => onZipBaseNameChange(event.target.value)}
        disabled={busy}
        spellCheck={false}
        aria-description=".zip is added automatically"
      />
      {multiModelGroups.map((unit) => {
        const group = unit.group;
        if (!group) {
          return null;
        }
        return (
          <Input
            key={group.id}
            label={`Group · ${group.name}`}
            value={groupBaseNames[group.id] ?? group.name}
            onChange={(event) => {
              onGroupBaseNameChange(group.id, event.target.value);
            }}
            disabled={busy}
            spellCheck={false}
          />
        );
      })}
      {exportUnits
        .filter((unit) => unit.kind === 'single')
        .map((unit) => {
          const model = unit.models[0];
          if (!model) {
            return null;
          }
          return (
            <Input
              key={model.id}
              label={stripGlbExtension(model.fileName)}
              value={
                modelBaseNames[model.id] ?? stripGlbExtension(model.fileName)
              }
              onChange={(event) => {
                onModelBaseNameChange(model.id, event.target.value);
              }}
              disabled={busy}
              spellCheck={false}
            />
          );
        })}
      <Text size="sm" variant="muted">
        {`Shared animation files keep their library names. .${format} is added automatically.`}
      </Text>
    </div>
  );
}
