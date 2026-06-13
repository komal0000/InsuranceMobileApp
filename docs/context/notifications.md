# InsuranceMobileApp Notifications Context

Last updated: 2026-06-13

Mobile notification behavior and push-related notes.

Read `INSURANCEMOBILEAPP_CONTEXT_SUMMARY.md` first when starting broad work, then use this file only when the task touches this domain.

## Notification Mobile Changes
- Alerts/notifications tab re-entry now keeps the existing notification list visible while page 1 and the unread count refresh in the background. First empty load still shows the full-page spinner, and pull-to-refresh remains the explicit fresh-data interaction.
- Native push alert taps now use the existing `notification_id` payload field to call `POST /api/notifications/{id}/read`, refresh the unread count after the read request, and keep the existing enrollment/renewal/notifications navigation behavior.
