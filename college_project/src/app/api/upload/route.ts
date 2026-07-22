import { getSessionUser } from '@/lib/auth';

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: 'File too large. Maximum size is 2 MB.' }, { status: 413 });
    }

    if (!file.type.startsWith('image/')) {
      return Response.json({ error: 'Only image files are allowed.' }, { status: 415 });
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return Response.json({ url: dataUrl });
  } catch (error: any) {
    console.error('[UPLOAD] Error:', error);
    return Response.json({ error: error.message || 'Upload failed.' }, { status: 500 });
  }
}
