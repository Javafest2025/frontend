# PDF Upload Feature

## Overview

The PDF upload feature allows users to upload PDF files directly to their project library. The system automatically:

1. **Uploads PDFs to Backblaze B2** cloud storage
2. **Extracts metadata** from the PDF (title, authors, abstract)
3. **Creates paper entries** in the backend database
4. **Makes papers searchable** in the library

## Environment Variables

Add these to your `.env.local` file:

```env
# Backblaze B2 Configuration (Server-side)
B2_KEY_ID=your_b2_key_id
B2_APPLICATION_KEY=your_b2_application_key
B2_BUCKET_NAME=your_bucket_name
B2_BUCKET_ID=your_bucket_id
```

## How It Works

### 1. File Selection
- Users can select multiple PDF files
- Only PDF files are accepted
- File size is displayed for each selected file

### 2. Metadata Extraction
- Uses PDF.js to extract document metadata
- Extracts title, authors, subject, keywords
- Generates abstract from first 2 pages
- Parses author names from metadata

### 3. Upload Process
- Files are uploaded to Backblaze B2 with unique names
- SHA1 hash is calculated for integrity
- Progress is tracked and displayed
- Download URLs are generated using file ID format: `https://f003.backblazeb2.com/b2api/v3/b2_download_file_by_id?fileId={fileId}`

### 4. Backend Integration
- Creates paper entries in the project library
- Uses the same structure as web search results
- Sets source as "Uploaded"
- Makes papers available for search and analysis

## File Structure

```
papers/
├── timestamp-randomId-filename.pdf
├── timestamp-randomId-filename.pdf
└── ...
```

## Download URL Format

Files are accessible via B2's file ID download format:
```
https://f003.backblazeb2.com/b2api/v3/b2_download_file_by_id?fileId={fileId}
```

This format provides:
- Direct file access without path dependencies
- Consistent URL structure across all uploaded files
- Better security (file IDs are unique and not guessable)

## API Endpoints

- **Upload**: `POST /api/v1/library/project/{projectId}/papers`
- **B2 Upload**: `POST /api/b2/upload` (Server-side API route)

## Error Handling

- Network errors during upload
- PDF parsing errors
- Backend API errors
- Invalid file types
- Missing environment variables

## Security

- Files are stored in private B2 bucket
- Access controlled by B2 credentials
- Unique file names prevent conflicts
- SHA1 verification ensures integrity

## Usage

1. Navigate to a project's library
2. Click "Upload Files" button
3. Select PDF files
4. Review extracted metadata
5. Click "Upload" to process
6. Files appear in "Uploaded Content" tab 