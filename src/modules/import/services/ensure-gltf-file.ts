import {
  GLTF_EXTENSION_PATTERN,
} from '@/utils/glb-parse';
import {
  hasModelExtension,
  withModelExtension,
} from '@/utils/with-model-extension';

const CONVERT_ENDPOINT = '/api/v1/fbx-to-glb';

export async function ensureGltfFile(file: File): Promise<File> {
  if (GLTF_EXTENSION_PATTERN.test(file.name)) {
    return file;
  }

  if (!hasModelExtension(file.name, 'fbx')) {
    throw new Error(
      'Unsupported file type. Please use .glb, .gltf, or .fbx',
    );
  }

  const formData = new FormData();
  formData.set('file', file);

  const response = await fetch(CONVERT_ENDPOINT, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'FBX conversion failed');
  }

  const blob = await response.blob();
  const glbName = withModelExtension(file.name, 'glb');
  return new File([blob], glbName, { type: 'model/gltf-binary' });
}
