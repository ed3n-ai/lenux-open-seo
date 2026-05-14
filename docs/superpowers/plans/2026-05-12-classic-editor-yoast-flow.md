# Classic Editor Yoast Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the proof-of-concept flow from calendar item to AI draft to WordPress Classic Editor + Yoast payload.

**Architecture:** Add a tested model module for classic editor drafts, then wire it into the existing content manager route. Keep persistence in `localStorage`, render the editor below the content writer, and keep production sync as stable payload generation for this phase.

**Tech Stack:** React 19, TanStack Router/Query, Vite, Vitest, localStorage, WordPress PHP plugin.

---

### Task 1: Classic Editor Model

**Files:**
- Create: `src/client/features/content/classicEditorModel.ts`
- Create: `src/client/features/content/classicEditorModel.test.ts`

- [ ] Write failing tests for creating a draft from a calendar item and AI draft, slug normalization, payload mapping, and defensive storage parsing.
- [ ] Run `pnpm vitest run src/client/features/content/classicEditorModel.test.ts` and verify tests fail because the module does not exist.
- [ ] Implement the model helpers and types.
- [ ] Re-run the same test command and verify it passes.

### Task 2: Classic Editor UI

**Files:**
- Create: `src/client/features/content/ClassicEditorWorkspace.tsx`
- Modify: `src/client/features/content/ContentWriterPanel.tsx`
- Modify: `src/client/features/content/ContentManagerWorkspace.tsx`
- Modify: `src/routes/_project/p/$projectId/ai.tsx`

- [ ] Add `פתח בעורך פרסום` to the content writer after an AI draft exists.
- [ ] Pass the generated draft and originating calendar item back to the route.
- [ ] Render `ClassicEditorWorkspace` below the content writer.
- [ ] Support editing title, slug, content, excerpt, publish settings, taxonomy, and Yoast fields.
- [ ] Add local save and payload preview/copy actions.

### Task 3: WordPress Plugin Compatibility

**Files:**
- Modify: `services/wordpress-plugin/openseo-bridge/includes/class-openseo-post-mapper.php`
- Modify: `services/wordpress-plugin/openseo-bridge/includes/class-openseo-yoast-adapter.php`

- [ ] Update the mapper to prefer `yoast` and fall back to `seo`.
- [ ] Return `updated_existing`.
- [ ] Add scheduled date handling for future drafts.
- [ ] Map MVP Yoast fields from the new names and keep old names compatible.

### Task 4: Verification And Deploy

**Files:**
- No new files.

- [ ] Run targeted Vitest for content model and existing content tests.
- [ ] Run `pnpm build`.
- [ ] If build passes, run `pnpm deploy` and report the production deployment result.
- [ ] If deploy is blocked by Cloudflare auth/env, report the exact blocker and leave the code ready for deploy.
