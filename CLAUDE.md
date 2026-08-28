# Claude Code Instructions

Please strictly follow the repository rules and guidelines defined in [AGENTS.md](file:///Users/sadin/Project/PokeCountTracker/AGENTS.md).

## Critical Deploy & Release Rule
- **Always update version & create a git tag on deploy**:
  1. Bump version in `package.json` (and version constants).
  2. Validate with `npm run lint && npm run build && npx playwright test`.
  3. Create tag: `git tag -a vX.Y.Z -m "Release vX.Y.Z - <description>"`.
  4. Push with tags: `git push origin main --tags`.
  5. Append release log to `AI_LOG.md`.
