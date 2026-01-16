# Letters Feature & Admin Enhancements

## Overview
This feature introduces a new "Letters" submission type for students and enhances the Admin Dashboard to manage all student submissions (Medical Certificates, Early Dismissal, and Letters) in a centralized view.

## Student Features

### 1. Letters Submission
Students can now submit official letters via the "Uploads" tab in their dashboard.
- **Fields**:
  - Parent's Full Name (Required)
  - Student's Full Name (Auto-filled)
  - Class (Required)
  - Date (Required)
  - Reason (Required)
  - File Upload (Required, PDF/Image/Doc)
- **Validation**: All fields are required. File size limit is 5MB.
- **Limits**: Shared limit of 5 submissions per year (combined with MC and Early Dismissal).

### 2. Submission History
The "Uploads" tab now features a unified history view for:
- Medical Certificates
- Early Dismissal Forms
- Letters
- Assignments (separate section)

## Admin Features

### 1. Student Submissions Management
A new section in the Admin Dashboard (`/dashboard/admin`) allows administrators to:
- **View All Submissions**: Filter by type (Letters, MC, Early Dismissal).
- **Search**: Search by student name.
- **Filter**: Filter by Status (Pending, Approved, Rejected) and Class.
- **Actions**: Approve or Reject submissions with optional comments.
- **Export**: Download current view as CSV.

### 2. Data Management
- **Dummy Data**: A script `scripts/generate-parent-data.ts` is available to populate dummy parent information (Name, Phone) for testing purposes.

## Technical Implementation

### Database
- **Submissions Table**: Uses existing `Submissions` model.
- **Type Enum**: Uses `LETTERS`, `MEDICAL_CERT`, `EARLY_DISMISSAL`.
- **Metadata**: Stores form specific fields (Parent Name, Reason, etc.) in the `metadata` JSON column.

### API Routes
- `GET /api/submissions`: Fetches submissions with support for type, class, and search filters.
- `POST /api/submissions`: Handles creation of new submissions including "LETTERS".
- `PUT /api/submissions/[id]`: New endpoint for Admin to update submission status (Approve/Reject) and add comments.

## Usage

### Running the Dummy Data Script
To populate existing students with fake parent data:
```bash
npx tsx scripts/generate-parent-data.ts
```
