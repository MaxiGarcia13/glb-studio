import type { ActionMenuItem } from '@/components/action-menu';
import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { ActionMenu } from '@/components/action-menu';
import { useGltfFilePicker } from '@/components/gltf-file-picker/use-gltf-file-picker';
import { AnimationIcon } from '@/components/icons/animation-icon';
import { BlocksIcon } from '@/components/icons/blocks-icon';
import { DownloadIcon } from '@/components/icons/download-icon';
import { ManIcon } from '@/components/icons/man-icon';
import { UploadIcon } from '@/components/icons/upload-icon';
import { startNewAnimation } from '@/modules/animation/stores/clip-store';
import {
  formatEditorCommandChord,
  formatEditorCommandChords,
  getEditorCommand,
  isMacPlatform,
  runEditorCommand,
} from '@/modules/commands';
import { LazyFromKitModal } from '@/modules/create/components/lazy-from-kit-modal';
import { LazyExportModal, useExportZip } from '@/modules/export';
import { importContentFiles } from '@/modules/import/actions/import-content-files';
import { useActiveModel } from '@/modules/viewport/hooks/use-active-model';
import { $model } from '@/modules/viewport/stores/model-store';

interface EditorFileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** File menu: new / kit / animation / import / export. */
export function EditorFileMenu({ open, onOpenChange }: EditorFileMenuProps) {
  const { canExport } = useExportZip();
  const { phase } = useStore($model, { keys: ['phase'] });
  const { scene } = useActiveModel();
  const [exportOpen, setExportOpen] = useState(false);
  const [fromKitOpen, setFromKitOpen] = useState(false);
  const isMac = isMacPlatform();
  const newModel = getEditorCommand('newModel');
  const newModelShortcut = newModel.chords[0];

  const { open: openImport, fileInput } = useGltfFilePicker({
    multiple: true,
    onFiles: (files) => {
      void importContentFiles(files);
    },
  });

  const items: ActionMenuItem[] = [
    {
      id: 'new-model',
      label: 'New model',
      icon: <ManIcon />,
      shortcut: newModelShortcut
        ? formatEditorCommandChord(newModelShortcut, isMac)
        : undefined,
      title: formatEditorCommandChords(newModel, isMac),
      onSelect: () => runEditorCommand('newModel'),
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
    <>
      {fileInput}
      <ActionMenu
        label="File"
        items={items}
        align="start"
        open={open}
        onOpenChange={onOpenChange}
      />
      <LazyExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <LazyFromKitModal open={fromKitOpen} onClose={() => setFromKitOpen(false)} />
    </>
  );
}
