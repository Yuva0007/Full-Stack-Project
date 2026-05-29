import fsPromises from 'fs/promises';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'documents.json');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const raw = await fsPromises.readFile(DATA_FILE, 'utf8');
    const docs = JSON.parse(raw || '[]');
    return res.status(200).json({ documents: docs, total: docs.length });
  } catch (err) {
    console.error(err);
    return res.status(200).json({ documents: [], total: 0 });
  }
}
