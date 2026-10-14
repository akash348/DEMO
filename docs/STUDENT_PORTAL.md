# Student portal

Live entry: `/student/login`. First-time students enter enrollment number and DOB to choose an 8–72 character password. Existing accounts sign in with their password; the institute resets forgotten passwords through the admin Students page.

After login, `/student/dashboard` shows the student's profile, assigned course and notes, fee summary and receipt PDFs, issued certificate PDFs, and exam results. `/student/exams` retains the timed exam flow. Account settings allow password changes with the current password. Changing a password revokes other sessions; logout revokes the current token.

PHP endpoints under `/student-auth`: `POST login`, `POST register`, `GET dashboard`, `POST password`, `POST logout`, `GET fees/{id}/pdf`, `GET certificates/{id}/pdf`. Protected endpoints require a student bearer token; document queries additionally filter by the authenticated student ID. Responses exclude password hashes and disable caching. Inactive accounts cannot sign in or use the portal.

Website source is `frontend-v2`. Live PHP implementation is `php-stack/api/src/student_portal.php` and the auth routes in `routes.php`. Per-student permissions use the `student_portal_access` table, created automatically by the deployment migration. See `STUDENT_ACCESS.md` for admin controls.

Release bundles retain the existing public website pages and append hashed assets before atomically replacing `index.html`. Deployment workflows back up the old entrypoint and restore it if HTTP checks fail.
