import { useState, useEffect } from 'react';
import UploadArea from '../components/UploadArea';

export default function UploadPage() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => { fetchDocs(); }, []);

  async function fetchDocs() {
    const res = await fetch('/api/documents');
    const body = await res.json();
    setDocuments(body.documents || []);
  }

  function onUploaded(item) {
    // optimistic: prepend to list
    setDocuments((d) => [{ id: item.document_id, filename: item.filename, size_bytes: item.size_bytes, upload_completed_at: new Date().toISOString(), status: item.status }, ...d]);
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-primary mb-6">Upload Documents</h2>
        <UploadArea onUploaded={onUploaded} />

        <section className="mt-8">
          <h3 className="text-lg font-medium mb-3">Documents</h3>
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Size</th>
                  <th className="px-4 py-2">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id} className="border-t">
                    <td className="px-4 py-2">{doc.filename}</td>
                    <td className="px-4 py-2">{doc.size_bytes}</td>
                    <td className="px-4 py-2">{new Date(doc.upload_completed_at).toLocaleString()}</td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr><td className="px-4 py-4" colSpan={3}>No documents yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
