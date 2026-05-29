import { IncomingForm } from 'formidable';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: false,
  },
};

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const DATA_FILE = path.join(process.cwd(), 'data', 'documents.json');

async function ensureDirs() {
  await fsPromises.mkdir(UPLOAD_DIR, { recursive: true });
  await fsPromises.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fsPromises.access(DATA_FILE);
  } catch (e) {
    await fsPromises.writeFile(DATA_FILE, '[]');
  }
}

function parseForm(req) {
  const form = new IncomingForm({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  await ensureDirs();

  try {
    const { fields, files } = await parseForm(req);

    // Support single file field named 'files' or 'file'
    const fileField = files.files || files.file;
    const file = Array.isArray(fileField) ? fileField[0] : fileField;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const originalFilename = file.originalFilename || file.newFilename || 'upload.pdf';
    const clientId = (fields.client_id || fields.clientId || (fields.client_ids && fields.client_ids[0])) || null;

    const documentId = uuidv4();
    const destPath = path.join(UPLOAD_DIR, `${documentId}_${originalFilename}`);

    // move file from temp path to uploads
    await fsPromises.copyFile(file.filepath || file.path, destPath);
    // optional: remove temp file
    try { fs.unlinkSync(file.filepath || file.path); } catch (e) {}

    // update simple JSON store
    const raw = await fsPromises.readFile(DATA_FILE, 'utf8');
    const docs = JSON.parse(raw || '[]');
    const stat = await fsPromises.stat(destPath);
    const doc = {
      id: documentId,
      filename: originalFilename,
      size_bytes: stat.size,
      mime_type: file.mimetype || 'application/pdf',
      s3_key: null,
      status: 'uploaded',
      upload_client_id: clientId || null,
      upload_completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    docs.unshift(doc);
    await fsPromises.writeFile(DATA_FILE, JSON.stringify(docs, null, 2));

    return res.status(200).json({ uploaded: [ { client_id: clientId, document_id: documentId, filename: originalFilename, size_bytes: doc.size_bytes, mime_type: doc.mime_type, status: doc.status } ] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Upload failed' });
  }
}
