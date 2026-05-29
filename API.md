# API Reference — Document Management Dashboard

This document describes the core REST endpoints used by the prototype (uploads, documents, downloads, and retry). Real-time events are delivered via Socket.IO (see realtime notes below).

Base URL: `/api`

## POST /api/upload
Accepts one or more PDF files. Each file is uploaded independently by the client (recommended) so the UI can show per-file progress.

Request (multipart/form-data):
- `files`: file[] (one or multiple)
- `client_ids[]` (optional): array of client-generated UUIDs to map uploads to UI rows

Response 200:
```
{
  "uploaded": [
    {
      "client_id": "<client-uuid>",
      "document_id": "<server-uuid>",
      "filename": "report.pdf",
      "size_bytes": 123456,
      "mime_type": "application/pdf",
      "status": "uploaded"
    }
  ]
}
```

Notes:
- For better UX and scalability you can implement a presigned-S3 flow: request presigned URLs for each file, then PUT directly to S3 from the browser. The server still creates document records and returns `document_id`.
- The client should map `client_id` → `document_id` when the server responds so progress UI can update.

Example cURL (server-side multipart upload):
```
curl -X POST "http://localhost:3000/api/upload" \
  -F "files=@/path/to/report.pdf"
```

## GET /api/documents
List documents (pagination supported).

Query params: `limit`, `offset`, `status`

Response:
```
{
  "documents": [ { "id","filename","size_bytes","mime_type","status","upload_completed_at" } ],
  "total": 42
}
```

## GET /api/documents/:id
Return metadata for a single document.

Response: document object with `metadata` JSON and job status summary.

## GET /api/documents/:id/download
Returns the file as a stream or a 302 redirect to a presigned S3 URL.

Example cURL:
```
curl -L "http://localhost:3000/api/documents/<id>/download" -o report.pdf
```

## POST /api/documents/:id/retry
Trigger a retry of processing tasks (or re-enqueue upload processing) for a failed document.

Request body (optional): `{ "type": "ocr" }`

Response: 202 Accepted with job reference.

## DELETE /api/documents/:id
Delete document metadata and remove associated file from storage. Returns 204 No Content on success.

## Errors
- 400 Bad Request — malformed upload or unsupported file type
- 413 Payload Too Large — file exceeds server limit
- 404 Not Found — document not found
- 500 Internal Server Error — server-side failure

## Realtime (Socket.IO) — summary
- `upload:progress` — `{ documentId, clientId, percent }` (optional; browser XHR progress is primary)
- `upload:complete` — `{ documentId, filename, size_bytes, s3_key }`
- `processing:queued` — `{ documentId, jobId, type }`
- `processing:progress` — `{ documentId, jobId, percent, message }`
- `processing:complete` — `{ documentId, jobId, result }`
- `notification` — `{ id, type, payload, created_at }`

Client implementation notes:
- Use per-file `XMLHttpRequest` or `fetch` with progress events to display per-file progress bars.
- Send a `client_id` for each file to map the server response to the UI list entry.
- On successful upload, update the document list and optionally show a toast notification when `processing:complete` arrives.
