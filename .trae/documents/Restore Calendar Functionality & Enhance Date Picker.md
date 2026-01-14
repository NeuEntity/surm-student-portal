# Fix Calendar Component by Downgrading to Compatible Version

I have identified the root cause of the calendar issues: **Version Mismatch**.
- The project has `react-day-picker` **v9.13.0** installed.
- The `components/ui/calendar.tsx` implementation is built for **v8.x** (standard for shadcn/ui).
- This causes the broken layout and missing styles seen in the screenshot, as v9 introduced breaking changes to class names and props.

## Evaluation of Alternatives
1.  **React-Day-Picker v8 (Recommended)**:
    -   **Pros**: Native compatibility with the project's UI library (shadcn/ui), fully accessible, lightweight, supports all required features (ranges, localization).
    -   **Cons**: Not the absolute latest major version, but is the stable LTS for this design system.
2.  **React-Datepicker**:
    -   **Pros**: Mature, "batteries included".
    -   **Cons**: Harder to style to match the specific "SURM" design theme (Tailwind), adds unnecessary bloat.
3.  **React-Calendar**:
    -   **Pros**: Simple.
    -   **Cons**: outdated styling, harder to customize for ranges.

## Implementation Plan (The "New Solution")
To provide the requested "reliable date range selection" with "minimal disruption":

1.  **Downgrade Library**: Replace `react-day-picker` v9 with **v8.10.1** to restore compatibility with the UI codebase.
2.  **Create Reusable DateRangePicker**: Extract the logic from `LeaveManagement` into a dedicated, robust `DateRangePicker` component. This ensures:
    -   Consistent UX across the app.
    -   Encapsulated validation (min/max dates).
    -   Better mobile responsiveness (auto-adjusting number of months).
3.  **Update Leave Management**: Refactor `LeaveManagement` to use this new robust component.

This approach fixes the immediate breakage AND delivers the improved, reusable component requested.