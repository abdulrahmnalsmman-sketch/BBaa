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

- Mushaf viewer was removed from the teacher view (button + page/screen deleted); build verified passing afterward.
- Mushaf data and files (~120MB) **deleted entirely** to reduce project size: mushaf page images, fonts, duplicate copy in another folder, and the loader script. Verified unused before deletion.
- Project source files reduced from ~495MB to <1MB; remaining disk usage is dev dependencies (node_modules), not shipped with build.
- Teacher assessment flow simplified to: تحضير الحضور → تحديد نطاق السور → التسميع.
- Follow `.bolt/prompt` global instructions (authoritative); do not restate them here.

## Open questions & assumptions

- If mushaf needs to return, it must be re-acquired/re-imported (data no longer in repo).
- RTL layout direction is assumed but not yet confirmed via explicit code observation.
- No other role views (e.g., student-facing) have been explored yet.