# Project memory

## Product intent & audience

- Quran memorization/learning platform (منصة تعليم/تحفيظ قرآن).
- User roles include: teacher (معلم) and manager/admin (مدير).
- Core teacher flow: attendance preparation → surah range selection → student recitation assessment (تسميع).
- Student profile/file exists; accessible at least to managers.

## Brand personality & voice

- UI language is Arabic; responses to the user should remain in Arabic.
- Tone is functional and production-oriented.

## Visual design & UX direction

- Vite + React (JSX), Tailwind CSS, Lucide React icons.
- Path alias `@/` maps to `src/` for all project imports.
- Avoid deep relative imports; use `@/components/Foo` style.
- Do not install UI theme/icon packages unless explicitly requested.
- No explicit color/typography/layout decisions inferred yet; `.bolt/prompt` mandates non-cookie-cutter, production-grade design.
- RTL layout assumed for Arabic interface (unconfirmed).

## Decisions, constraints & rationale

- Mushaf viewer was removed **entirely from the teacher view** (button + page/screen deleted); build verified passing afterward.
- Removed component confirmed unused elsewhere before deletion; no dangling references left in UI.
- Mushaf **data and files were intentionally preserved** — only UI removed, so it can be reused elsewhere later.
- Teacher assessment flow simplified to: تحضير الحضور → تحديد نطاق السور → التسميع.
- Follow `.bolt/prompt` global instructions (authoritative); do not restate them here.

## Open questions & assumptions

- Should the mushaf remain available to the manager in the student file, or be removed from the entire platform? (asked of user; unresolved)
- RTL layout direction is assumed but not yet confirmed via explicit code observation.
- No other role views (e.g., student-facing) have been explored yet.