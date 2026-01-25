# Econ Data Approval App

A full-stack application for uploading, parsing, reviewing, and approving long-format economic data from Excel files.

## Tech Stack
- **Backend**: FastAPI, SQLModel (SQLAlchemy), SQLite, Pandas, Openpyxl
- **Frontend**: React, Vite, TypeScript, shadcn/ui, Tailwind CSS
- **Features**: Excel parsing, validation, RBAC (Alice/Bob/Admin), Row-level preview, CSV export.

## Development Setup

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The UI will be available at `http://localhost:5173`.

## Authentication (Dev Mode)

The application uses a hardcoded mechanism for development roles via the `X-Dev-User` header.
- **Alice**: Uploader (Can upload, view own)
- **Bob**: Approver (Can view all, approve)
- **Admin**: Superuser (All permissions)

In the UI, use the dropdown in the top-right corner to switch roles.

## API Usage (CURL Examples)

### 1. Upload a File (Alice)
```bash
curl -X POST "http://localhost:8000/imports/" \
  -H "X-Dev-User: alice" \
  -F "file=@/path/to/data.xlsx"
```

### 2. List Imports (Bob)
```bash
curl -X GET "http://localhost:8000/imports/" \
  -H "X-Dev-User: bob"
```

### 3. Get Import Details
```bash
curl -X GET "http://localhost:8000/imports/{import_uuid}" \
  -H "X-Dev-User: bob"
```

### 4. Approve Import (Bob/Admin only)
```bash
curl -X POST "http://localhost:8000/imports/{import_uuid}/approve" \
  -H "X-Dev-User: bob"
```

### 5. Download CSV
```bash
curl -X GET "http://localhost:8000/imports/{import_uuid}/download/csv" \
  -H "X-Dev-User: alice" \
  -O
```
