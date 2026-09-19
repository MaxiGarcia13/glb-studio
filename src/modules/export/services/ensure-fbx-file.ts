import {
  hasModelExtension,
  withModelExtension,
} from '@/utils/with-model-extension';

const CONVERT_ENDPOINT = '/api/v1/glb-to-fbx';

/**
 * Ensure `file` is an FBX `File` for zip packing.
 * Already-`.fbx` passes through; `.glb` posts to the convert API.
 */
export async function ensureFbxFile(file: File): Promise<File> {
  if (hasModelExtension(file.name, 'fbx')) {
    return file;
  }

  if (!hasModelExtension(file.name, 'glb')) {
    throw new Error('Only .glb files can be converted to FBX');
  }

  const formData = new FormData();
  formData.set('file', file);

  const response = await fetch(CONVERT_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'GLB to FBX conversion failed');
  }

  const blob = await response.blob();
  const fbxName = withModelExtension(file.name, 'fbx');
  return new File([blob], fbxName, { type: 'application/octet-stream' });
}
