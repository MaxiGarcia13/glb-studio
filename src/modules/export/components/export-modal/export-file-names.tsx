import type { ExportFormat } from '@/modules/export/utils/file-name';
import type { ModelEntry } from '@/modules/viewport/types/model';
import type { ModelGroup } from '@/modules/viewport/types/model-group';

import { Input } from '@/components/input/input';
import { Select } from '@/components/select';
import { Text } from '@/components/text';
import { stripExportExtension } from '@/modules/export/utils/file-name';

interface ExportUnitLike {
  kind: 'group' | 'single';
  group: ModelGroup | null;
  models: ModelEntry[];
}

interface ExportFileNamesProps {
  format: ExportFormat;
  busy: boolean;
  zipBaseName: string;
  exportAsFolders: boolean;
  groupBaseNames: Record<string, string>;
  modelBaseNames: Record<string, string>;
  multiModelGroups: ExportUnitLike[];
  exportUnits: ExportUnitLike[];
  onFormatChange: (format: ExportFormat) => void;
  onZipBaseNameChange: (value: string) => void;
  onExportAsFoldersChange: (value: boolean) => void;
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
  exportAsFolders,
  groupBaseNames,
  modelBaseNames,
  multiModelGroups,
  exportUnits,
  onFormatChange,
  onZipBaseNameChange,
  onExportAsFoldersChange,
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
      <label className="flex items-center gap-2 cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={exportAsFolders}
          disabled={busy}
          onChange={(event) => onExportAsFoldersChange(event.target.checked)}
          className="size-4 shrink-0 rounded-sm border-border-strong accent-accent"
        />
        <Text variant="muted">Export as folders</Text>
      </label>
      {exportAsFolders
        ? (
            <Text size="sm" variant="muted">
              {`Each model gets a folder with the mesh .${format}, animations/, and skins/ (PNG).`}
            </Text>
          )
        : null}
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
              label={stripExportExtension(model.fileName)}
              value={
                modelBaseNames[model.id] ?? stripExportExtension(model.fileName)
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
        {exportAsFolders
          ? `Clip and skin file names stay library / session labels. .${format} is added for models and clips.`
          : `Shared animation files keep their library names. .${format} is added automatically.`}
      </Text>
    </div>
  );
}
