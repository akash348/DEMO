# Per-student portal access

Admins open **Students → Portal Access** and save separate controls for portal/login, profile details, course details, notes, fees/receipts, exams, results and certificates. These settings apply only to the selected student. Existing students retain current access until changed.

Disabling portal access revokes the student's active tokens and blocks login/password setup. Dashboard responses omit hidden data, and protected notes, receipt, certificate and exam endpoints enforce the flags. Exam submissions retain scores for the institute while omitting scores from the student response if results are hidden. Basic name/enrollment and password/logout controls remain available to signed-in students.

`GET/PUT /students/{id}/portal-access` requires an administrator token. Only boolean values and recognized fields are accepted. `student_portal_access` stores the settings; the idempotent deployment migration creates this table before publishing the API changes. Changing permissions does not delete student records, payments, results or certificates. Public website information remains public.
