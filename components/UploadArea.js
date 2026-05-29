import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function UploadArea({ onUploaded }) {
  const [files, setFiles] = useState([]);

  function handleFiles(selectedFiles) {
    const arr = Array.from(selectedFiles).map((f) => ({
      id: uuidv4(),
      file: f,
      name: f.name,
      size: f.size,
      progress: 0,
      status: 'pending',
    }));
    setFiles((s) => [...arr, ...s]);
    arr.forEach(uploadFile);
  }

  function uploadFile(item) {
    const form = new FormData();
    form.append('files', item.file);
    form.append('client_id', item.id);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setFiles((prev) => prev.map((p) => p.id === item.id ? { ...p, progress: percent, status: 'uploading' } : p));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setFiles((prev) => prev.map((p) => p.id === item.id ? { ...p, progress: 100, status: 'uploaded' } : p));
        try { const body = JSON.parse(xhr.responseText); if (body?.uploaded?.[0]) onUploaded(body.uploaded[0]); } catch(e) {}
      } else {
        setFiles((prev) => prev.map((p) => p.id === item.id ? { ...p, status: 'failed' } : p));
      }
    };
    xhr.onerror = () => {
      setFiles((prev) => prev.map((p) => p.id === item.id ? { ...p, status: 'failed' } : p));
    };
    xhr.send(form);
  }

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-md p-6">
      <input id="file-input" type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      <label htmlFor="file-input" className="cursor-pointer">
        <div className="text-center py-12">
          <p className="text-lg font-medium">Drag & drop PDF files here, or click to select</p>
          <p className="text-sm text-gray-500">Supports single & bulk uploads</p>
        </div>
      </label>

      <div className="mt-4 space-y-3">
        {files.map(f => (
          <div key={f.id} className="p-3 border rounded-md bg-white flex items-center justify-between">
            <div>
              <div className="font-medium">{f.name}</div>
              <div className="text-xs text-gray-500">{formatBytes(f.size)} • {f.status}</div>
            </div>
            <div className="w-1/3">
              <div className="h-2 bg-gray-100 rounded">
                <div className="h-2 bg-primary rounded" style={{ width: `${f.progress}%` }} />
              </div>
              <div className="text-xs text-right mt-1">{f.progress}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
