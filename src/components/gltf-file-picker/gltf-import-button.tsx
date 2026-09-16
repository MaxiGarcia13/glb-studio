import { Button } from '@/components/button';
import { UploadIcon } from '@/components/icons/upload-icon';

import { useGltfFilePicker } from './use-gltf-file-picker';

interface GltfImportButtonProps {
  disabled: boolean;
  label: string;
  onImport?: () => void;
  onFiles: (files: File[]) => void;
}

export function GltfImportButton({ disabled, label, onImport, onFiles }: GltfImportButtonProps) {
  const { open, fileInput } = useGltfFilePicker({
    multiple: true,
    onFiles: (files) => {
      onFiles(files);
    },
  });

  return (
    <>
      {fileInput}
      <Button
        onClick={() => {
          open();
          onImport?.();
        }}
        disabled={disabled}
        variant="ghost"
        aria-label={label}
        title={label}
        className="p-2"
      >
        <UploadIcon />
      </Button>
    </>
  );
}
