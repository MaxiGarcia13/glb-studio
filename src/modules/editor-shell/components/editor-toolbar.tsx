import type { ActionMenuItem } from '@/components/action-menu';
import { useStore } from '@nanostores/react';
import { useState } from 'react';
import { ActionMenu, ActionMenuPanel } from '@/components/action-menu';
import { useGltfFilePicker } from '@/components/gltf-file-picker/use-gltf-file-picker';
import { AnimationIcon } from '@/components/icons/animation-icon';
import { DownloadIcon } from '@/components/icons/download-icon';
import { ModelIcon } from '@/components/icons/model-icon';
import { UploadIcon } from '@/components/icons/upload-icon';
import { startNewAnimation } from '@/modules/animation/stores/clip-store';
import { createEmptyModel } from '@/modules/create/actions/create-empty-model';
import { ExportModal, useExportZip } from '@/modules/export';
import { useActiveModel } from '@/modules/viewport/hooks/use-active-model';
import { $model, importModelFiles } from '@/modules/viewport/stores/model-store';
import { WorldAxesControls } from './world-axes-controls';

type OpenMenu = 'file' | 'settings' | null;

/** Full-width Blender-style app menu bar (File / Settings). */
export function EditorToolbar() {
  const { canExport } = useExportZip();
  const { phase } = useStore($model, { keys: ['phase'] });
  const { scene } = useActiveModel();
  const [exportOpen, setExportOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);

  const { open: openImport, fileInput } = useGltfFilePicker({
    multiple: true,
    onFiles: (files) => {
      void importModelFiles(files);
    },
  });

  const fileItems: ActionMenuItem[] = [
    {
      id: 'new-model',
      label: 'New model',
      icon: <ModelIcon />,
      onSelect: () => createEmptyModel(),
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
        >
          <WorldAxesControls />
        </ActionMenuPanel>
      </header>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
