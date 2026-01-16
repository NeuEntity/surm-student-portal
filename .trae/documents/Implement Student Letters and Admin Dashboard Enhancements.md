# Implementation Plan for Student Letters & Admin Enhancements

## 1. Student Dashboard Enhancements (`components/dashboard/student-dashboard.tsx`)
- **Add "Letters" Form Tab**:
  - Implement a new tab for "Letters" alongside "Medical Certificate" and "Early Dismissal".
  - **Fields**:
    - Parents Full Name (Required Text)
    - Student Full Name (Auto-filled/Required Text)
    - Class (Required Dropdown)
    - Date (Required Date Picker)
    - Reason (Required Textarea)
    - File Upload (Required)
  - **State Management**: Add `lettersForm` state and validation logic.
  - **Submission Handler**: Implement `handleLettersSubmit` to post data to `/api/submissions` with `type: "LETTERS"`.

- **Enhance Submission History ("Uploads" Tab)**:
  - Filter history to show `LETTERS`, `MEDICAL_CERT`, and `EARLY_DISMISSAL`.
  - Add client-side filtering controls (e.g., "All", "Letters", "MC", "Dismissal").
  - Update the list item design to show relevant details for each type.

## 2. Admin Dashboard Enhancements
- **Create New Component**: `components/dashboard/admin-student-submissions.tsx`
  - **Features**:
    - Tabs for "All", "Letters", "Medical Certificates", "Early Dismissal".
    - Data Table with columns: Student Name, Class, Type, Date, Status, Actions.
    - **Actions**: "Approve" and "Reject" buttons that update the submission status via API.
    - **Filtering/Search**: Search by student name or class.
    - **Export**: Simple CSV export functionality for the current view.
  
- **Update Admin Page**: `app/dashboard/admin/page.tsx`
  - Import and render `AdminStudentSubmissions` in a new section (e.g., "Student Submissions Management").

## 3. Backend & Data
- **API Verification**: Ensure `/api/submissions` correctly handles `LETTERS` type (confirmed during research).
- **Dummy Data Generation**:
  - Create `scripts/generate-parent-data.ts`.
  - Script will iterate through existing students and assign realistic dummy data for:
    - `parentName`
    - `parentPhone`
    - `icNumber` (if missing)
  - Run this script to populate the database.

## 4. Documentation
- Update `README.md` or create `docs/LETTERS_FEATURE.md` to document the new "Letters" feature, admin capabilities, and data structures.

## 5. Verification
- **Unit Tests**: Add tests for the new form validation logic.
- **Manual Verification**:
  - Login as Student -> Submit a Letter -> Check History.
  - Login as Admin -> View Letter -> Approve/Reject -> Check Status update.
