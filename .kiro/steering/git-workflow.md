---
inclusion: manual
---

# Git workflow for this team

Use with `#git-workflow` when pulling, merging, or committing.

- Never commit while `git pull` reports `CONFLICT`. A merge commit with
  conflict markers was pushed once and broke the build for everyone
  (`src/app/Layout.jsx`).
- Before committing: `node scripts/check-conflicts.mjs` and
  `node scripts/check-bundle.mjs`.
- When both sides changed the same feature, read both versions and combine
  them on purpose (e.g. keep a teammate's translations *and* our safety checks);
  don't pick a side wholesale.
- Preview conflicts without touching files:
  `git merge-tree --write-tree --name-only --no-messages main origin/main`.
- Agents give the user the commit and push commands; they don't push.
- Never commit `.env.local` (covered by `*.local` in `.gitignore`).
  Do commit the whole `.kiro/` folder.
