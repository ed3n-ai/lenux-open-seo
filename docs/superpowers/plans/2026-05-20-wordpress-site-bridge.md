# WordPress Site Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Lenux28 SEO site-level WordPress bridge so a project can store one WordPress connection, test it, and send a prepared publishing-editor draft to WordPress.

**Architecture:** Add a project-scoped `wordpress_site_connections` table, a server-side repository/service for connection storage and bridge HTTP calls, server functions for UI access, and a compact connection/sync panel inside the existing Classic Editor workspace. Keep the WordPress REST namespace `openseo/v1` while changing customer-facing plugin labels to `Lenux28 SEO`.

**Tech Stack:** React 19, TanStack React Start server functions, Drizzle SQLite/D1, Vitest, WordPress REST plugin PHP.

---

### Task 1: Data Model

**Files:**
- Modify: `src/db/app.schema.ts`
- Create: `drizzle/0012_wordpress_site_connections.sql`

- [ ] Add `wordpressSiteConnections` with one connection per project.
- [ ] Store `displayName`, `siteUrl`, `sharedSecret`, `lastStatus`, `lastError`, `lastCheckedAt`, `createdAt`, and `updatedAt`.
- [ ] Add a unique index on `project_id`.

### Task 2: Server Contract

**Files:**
- Modify: `src/types/schemas/content.ts`
- Create: `src/server/features/content/repositories/WordPressConnectionRepository.ts`
- Create: `src/server/features/content/services/WordPressBridgeService.ts`
- Modify: `src/serverFunctions/content.ts`

- [ ] Add schemas for get/save/test/publish WordPress connection.
- [ ] Normalize site URLs to origin-only HTTPS/HTTP URLs without trailing slash.
- [ ] Test the plugin through `GET /wp-json/openseo/v1/health`.
- [ ] Publish through `POST /wp-json/openseo/v1/posts/upsert` with `x-openseo-secret`.
- [ ] Persist test status and return clear errors to the UI.

### Task 3: WordPress Plugin Health + Labels

**Files:**
- Modify: `services/wordpress-plugin/openseo-bridge/openseo-bridge.php`
- Modify: `services/wordpress-plugin/openseo-bridge/includes/class-openseo-rest.php`
- Modify: `services/wordpress-plugin/openseo-bridge/includes/class-openseo-settings.php`
- Modify: `services/wordpress-plugin/openseo-bridge/README.md`

- [ ] Change visible plugin/admin labels to `Lenux28 SEO Bridge`.
- [ ] Add `GET /wp-json/openseo/v1/health` protected by the same shared secret.
- [ ] Return `{ ok: true, product: "Lenux28 SEO", plugin_version, site_url }`.

### Task 4: Classic Editor UI

**Files:**
- Modify: `src/client/features/content/ClassicEditorWorkspace.tsx`

- [ ] Load project WordPress connection on editor mount.
- [ ] Let the user save display name, site URL, and shared secret.
- [ ] Let the user test the connection.
- [ ] Replace “copy payload” as the main action with “send to WordPress”.
- [ ] Keep payload copy available as a secondary debug action.
- [ ] Store returned `wpPostId`, `editUrl`, sync status, and sync error in the local editor draft.

### Task 5: Verification

**Files:**
- Test: `src/server/features/content/services/WordPressBridgeService.test.ts`
- Test: existing content/client tests

- [ ] Add unit tests for URL normalization, health endpoint construction, and publish endpoint construction.
- [ ] Run targeted Vitest tests.
- [ ] Run `npm run build`.

