import type { APIRoute } from 'astro';
import {
  convertGlbToFbx,
  GlbToFbxConvertError,
} from '@/modules/export/adapters/convert-glb-to-fbx';
import { toArrayBuffer } from '@/utils/to-array-buffer';
import { withModelExtension } from '@/utils/with-model-extension';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return new Response('Expected multipart/form-data', { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return new Response('Missing "file" field', { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fbxBuffer = await convertGlbToFbx(file.name, arrayBuffer);

    return new Response(toArrayBuffer(fbxBuffer), {
      status: 200,
      headers: {
        'content-type': 'application/octet-stream',
        'content-disposition': `attachment; filename="${withModelExtension(file.name, 'fbx')}"`,
      },
    });
  } catch (err) {
    if (err instanceof GlbToFbxConvertError) {
      return new Response(err.message, { status: err.status });
    }
    console.error('[glb-to-fbx]', err);
    return new Response('Conversion failed', { status: 500 });
  }
};
