## RAG App (FastAPI + React/Vite)

Full‑stack RAG playground with a FastAPI backend and a React (Vite) frontend. Backend uploads documents to S3 and proxies chat requests to a Modal endpoint.

### Tech Stack
- **Frontend**: React 19 + Vite
- **Backend**: FastAPI (served via `uvicorn`)
- **Storage**: AWS S3

---

### Prerequisites
- Conda (Miniconda or Anaconda)
- Node.js 18+ and npm
- AWS credentials with access to the target S3 bucket

---

### 1) Clone and install
```bash
git clone <your-repo-url>
cd RagApp

# Python deps via Conda
conda env create -f environment.yml
conda activate rag_app

# Frontend deps
npm install
```

---

### 2) Configure environment
Create a `.env` file in the project root with:
```bash
AWS_S3_BUCKET_NAME=your-bucket
AWS_S3_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

MODAL_UPLOAD_URL=https://your-modal-upload-endpoint
MODAL_CHAT_URL=https://your-modal-chat-endpoint
MODAL_API_TOKEN=your-modal-api-token
```

Notes:
- CORS is currently allowed for `http://localhost:5174` and `http://127.0.0.1:5174` in the backend. Run Vite on port 5174 to avoid CORS errors.

---

### 3) Run the app
- **Backend** (FastAPI via `uvicorn`):
```bash
npm start
```
This runs `uvicorn main:app` (default at `http://127.0.0.1:8000`).

- **Frontend** (Vite on port 5174):
```bash
npm run dev -- --port 5174
```
Vite dev server will be available at `http://localhost:5174`.

---

### API Overview

- `POST /api/upload`
  - Form‑data: `file` (document to upload)
  - Action: uploads file to S3 and calls `MODAL_UPLOAD_URL`
  - Returns: `{ session_id, filename }`

- `POST /api/chat`
  - JSON body: `{ "session_id": string, "message": string }`
  - Action: forwards to `MODAL_CHAT_URL` with `{ session_id, questions: [message] }`
  - Returns: Modal response JSON

---

### Project Scripts
```json
{
  "start": "uvicorn main:app",
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

---

### Repo structure
```
RagApp/
├─ main.py                 # FastAPI app (S3 upload, chat proxy)
├─ environment.yml         # Conda environment (python + deps)
├─ package.json            # Frontend scripts and deps
├─ src/                    # React app source
├─ public/                 # Static assets
├─ vite.config.js          # Vite config
└─ README.md
```
 
---

### Troubleshooting
- If you see CORS errors, ensure the frontend runs on `5174` or update allowed origins in `main.py`.
- Ensure your AWS creds and bucket/region are correct; `main.py` constructs public S3 URLs as `https://{bucket}.s3.{region}.amazonaws.com/{key}`.
- Modal endpoints must accept the shapes documented above and the `Authorization: Bearer <MODAL_API_TOKEN>` header.

---

### License
MIT (or your preferred license)
