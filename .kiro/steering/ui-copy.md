---
inclusion: fileMatch
fileMatchPattern: ['src/**/*.jsx', 'src/features/care/carePreferences.jsx']
---

# UI text and accessibility

- **No research codes on screen.** O1–O10, A-1, B-14, C-11, X-1 and similar
  belong in code comments only. Run `node scripts/check-conflicts.mjs --codes`
  to find any that leak into visible text.
- **Plain words.** Short sentences, everyday terms ("heart specialist
  (cardiology)"), no jargon. Name the reason for a decision on screen
  ("Accepts your Medicaid", "Sent findings back for 7 of 11").
- **Two languages.** Home and Care & Cost are translated. New text there goes
  through `t('key')` with both `en` and `es` entries in
  `src/features/care/carePreferences.jsx`. The language setting is app-wide
  (`CarePreferencesProvider` in `App.jsx`) and remembered in `localStorage`.
- **Easy-read mode** enlarges text; don't hard-code tiny fonts for key content.
- **Don't fake interactivity.** Chips that look like buttons must do something.
- Use the shared components in `src/shared/ui.jsx` (`Card`, `Badge`, `Button`,
  `PageHeader`, `money`) and the section accents `care`, `find`, `coordinate`.
