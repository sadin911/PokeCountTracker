# Cross-Agent Repository Rules & Guidelines

This document applies to **all AI coding assistants** working on this repository, including **Antigravity IDE, Claude Code, Gemini CLI, GitHub Copilot, and Cursor**.

---

## 1. Mandatory Version Bump & Git Tag on Deploy (CRITICAL)

Whenever taking changes live, merging to `main`, or triggering a production deployment:

1. **Synchronize Version Numbers**:
   - Update `"version"` in [`package.json`](file:///Users/sadin/Project/PokeCountTracker/package.json) (SemVer: `x.y.z`).
   - Update version constants in code if applicable.
2. **Quality Gate Verification Before Tagging**:
   - Run linter and typecheck: `npm run lint`
   - Run production build: `npm run build`
   - Run E2E tests: `npx playwright test`
   - Ensure all checks pass with 0 errors before tagging.
3. **Git Tagging & Push**:
   - Create an annotated git tag matching the version format `vX.Y.Z`:
     ```bash
     git tag -a vX.Y.Z -m "Release vX.Y.Z - <short description>"
     ```
   - Push both commits and tags to remote:
     ```bash
     git push origin main --tags
     ```
4. **Log in AI_LOG.md**:
   - Record the release with level `Major` and action `Release | vX.Y.Z - <summary>`.

---

## 2. Shared Action Log (`AI_LOG.md`)

Every agent MUST maintain [`AI_LOG.md`](file:///Users/sadin/Project/PokeCountTracker/AI_LOG.md) in the project root.

### Format
```text
[YYYY-MM-DD HH:MM] LEVEL | AGENT | TOOL | description
```

### Rules
- One line per action, UTF-8, append-only (never overwrite or truncate).
- Log every Major action immediately after it completes.

---

## 3. Testing Policy: Automated E2E Only (Strictly No Manual Screenshot Verification)

Whenever verifying frontend features, bug fixes, or user flows:
1. **No Manual Screenshots**: Do NOT take, capture, or view screenshots to test or inspect page states visually.
2. **Automated E2E Testing Only**: All visual and functional verification MUST be conducted via Playwright automated E2E tests (`npx playwright test`) and Vitest unit tests (`npm test`).
3. **Write E2E Tests for New Features**: For every new UI flow, catalog, or interactive modal, add corresponding automated test cases under `e2e/*.spec.ts` with explicit locators and assertions.

