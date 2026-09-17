import type { ActionMenuItem } from '@/components/action-menu';
import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { ActionMenu, ActionMenuPanel } from '@/components/action-menu';
import { Button } from '@/components/button';
import { useGltfFilePicker } from '@/components/gltf-file-picker/use-gltf-file-picker';
import { AnimationIcon } from '@/components/icons/animation-icon';
import { BlocksIcon } from '@/components/icons/blocks-icon';
import { DownloadIcon } from '@/components/icons/download-icon';
import { ManIcon } from '@/components/icons/man-icon';
import { UploadIcon } from '@/components/icons/upload-icon';
import { Text } from '@/components/text';
import { importClipResults, startNewAnimation } from '@/modules/animation/stores/clip-store';
import {
  CommandsModal,
  useEditorCommandHotkeys,
} from '@/modules/commands';
import { createEmptyModel } from '@/modules/create/actions/create-empty-model';
import { FromKitModal } from '@/modules/create/components/from-kit-modal';
import { ExportModal, useExportZip } from '@/modules/export';
import { routeContentImport } from '@/modules/import/adapters/content-router';
import { useActiveModel } from '@/modules/viewport/hooks/use-active-model';
import { createModelGroup } from '@/modules/viewport/stores/model-group-store';
import { $model, importModelResults } from '@/modules/viewport/stores/model-store';
import { SelectionContextMenu } from './selection-context-menu';
import { SnapControls } from './snap-controls';
import { WorldAxesControls } from './world-axes-controls';

type OpenMenu = 'file' | 'settings' | null;

/** Full-width Blender-style app menu bar (File / Settings / Commands). */
export function EditorToolbar() {
  useEditorCommandHotkeys();

  const { canExport } = useExportZip();
  const { phase } = useStore($model, { keys: ['phase'] });
  const { scene } = useActiveModel();
  const [exportOpen, setExportOpen] = useState(false);
  const [fromKitOpen, setFromKitOpen] = useState(false);
  const [commandsOpen, setCommandsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  const { open: openImport, fileInput } = useGltfFilePicker({
    multiple: true,
    onFiles: (files) => {
      void (async () => {
        const { models, sharedClips, errors, groupsToCreate } = await routeContentImport(files);
        const loaded
          = models.length > 0 || errors.length > 0
            ? importModelResults(models, errors)
            : [];
        for (const group of groupsToCreate) {
          const ids = group.modelIndexes
            .map((index) => loaded[index]?.id)
            .filter((id): id is string => Boolean(id));
          createModelGroup(ids, { name: group.name });
        }
        if (sharedClips.length > 0) {
          importClipResults(sharedClips, null);
        }
      })();
    },
  });

  const fileItems: ActionMenuItem[] = [
    {
      id: 'new-model',
      label: 'New model',
      icon: <ManIcon />,
      onSelect: () => createEmptyModel(),
    },
    {
      id: 'from-kit',
      label: 'From kit…',
      icon: <BlocksIcon />,
      title: 'Start from a starter kit (building, robot, …)',
      onSelect: () => setFromKitOpen(true),
    },
    {
      id: 'new-animation',
      label: 'New animation',
      icon: <AnimationIcon />,
      disabled: scene === null,
      onSelect: () => startNewAnimation(scene),
    },
    {
      id: 'import',
      label: 'Import',
      icon: <UploadIcon />,
      disabled: phase === 'loading',
      onSelect: () => openImport(),
    },
    {
      id: 'export',
      label: 'Export',
      icon: <DownloadIcon />,
      disabled: !canExport,
      onSelect: () => setExportOpen(true),
    },
  ];

  return (
    <div className="w-full shrink-0">
      {fileInput}
      <header
        role="menubar"
        aria-label="Editor menu"
        className="flex items-center gap-1 border-b border-border bg-surface px-2 py-1"
      >
        <ActionMenu
          label="File"
          items={fileItems}
          align="start"
          open={openMenu === 'file'}
          onOpenChange={(open) => setOpenMenu(open ? 'file' : null)}
        />
        <ActionMenuPanel
          label="Settings"
          align="start"
          open={openMenu === 'settings'}
          onOpenChange={(open) => setOpenMenu(open ? 'settings' : null)}
          panelClassName="flex flex-col gap-6"
        >
          <WorldAxesControls />
          <SnapControls />
        </ActionMenuPanel>
        <Button
          variant="ghost"
          className="px-2 py-1"
          aria-haspopup="dialog"
          aria-expanded={commandsOpen}
          onClick={() => {
            setOpenMenu(null);
            setCommandsOpen(true);
          }}
        >
          <Text as="span" className="text-current">
            Commands
          </Text>
        </Button>
      </header>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <FromKitModal open={fromKitOpen} onClose={() => setFromKitOpen(false)} />
      <CommandsModal open={commandsOpen} onClose={() => setCommandsOpen(false)} />
      <SelectionContextMenu />
    </div>
  );
}
