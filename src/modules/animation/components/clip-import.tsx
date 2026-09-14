import { GltfImportButton } from '@/components/gltf-file-picker/gltf-import-button';
import { useActiveModel } from '@/modules/viewport/hooks/use-active-model';
import { importClipFiles } from '../stores/clip-store';

interface ClipImportProps {
  onImport?: () => void;
}

export function ClipImport({ onImport }: ClipImportProps) {
  const { scene } = useActiveModel();

  return (
    <GltfImportButton
      disabled={false}
      label="Import animations"
      onImport={onImport}
      onFiles={(files) => {
        void importClipFiles(files, scene);
      }}
    />
  );
}
