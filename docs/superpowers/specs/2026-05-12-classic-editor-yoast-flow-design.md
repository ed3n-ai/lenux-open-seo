# Classic Editor + Yoast Flow Design

## Goal

Build the full functional flow for a content manager before doing final brand design.

The product flow should feel like preparing a real WordPress post, not like filling a technical payload form. The final visual brand, logo, palette, and polished design system are intentionally postponed until the complete logic is visible in the product.

## Product Flow

The approved flow is:

```text
Idea -> Calendar -> Create Draft -> Content Writer -> Open in Publishing Editor -> WordPress Classic Editor + Yoast -> WordPress payload
```

The important product decision is that the content writer is a required step in the publishing journey. The user should be guided into using the AI writer before opening the WordPress-style publishing editor.

## User Journey

1. A content manager creates or saves an idea.
2. The idea is added to the content calendar.
3. The user clicks `צור טיוטה` on a calendar item.
4. The content writer receives a prefill from the calendar item:
   - topic from the idea title
   - audience from the current content defaults
   - keywords from the primary and secondary keywords
5. The page scrolls to the content writer.
6. The user generates an AI draft.
7. After the AI draft exists, the content writer shows a clear `פתח בעורך פרסום` action.
8. Clicking that action creates or opens a local `WordPressClassicPostDraft`.
9. The publishing editor appears below the content writer on the same page.
10. The user edits the WordPress-style post fields, Yoast fields, taxonomy, and publish settings.
11. The editor can save locally and build a stable WordPress plugin payload.

The editor should not open automatically after generation. The user must explicitly choose to open the generated draft in the publishing editor.

## Scope

In scope:

- Add a `WordPressClassicPostDraft` model.
- Add model helpers for creating drafts from calendar items and AI drafts.
- Add model helpers for mapping classic editor drafts to the WordPress plugin payload.
- Store classic editor drafts in `localStorage`, keyed by project and user.
- Replace the technical `WordPressPublishSection` experience with a WordPress Classic Editor-style publishing editor.
- Keep the editor on the same page, below the content writer.
- Add a `פתח בעורך פרסום` action after an AI draft is generated.
- Keep a clean, readable UI based on the approved wireframe.
- Add tests for draft creation, slug normalization, Yoast fields, local payload mapping, and preservation of display titles.
- Update the WordPress plugin mapper contract to accept `yoast`.
- Keep temporary plugin compatibility with the existing `seo` payload shape where practical.

Out of scope for this phase:

- Final brand design.
- Logo work.
- Full design system.
- Rich text editor integration.
- Database persistence.
- Social Yoast fields.
- Automatic publishing to WordPress.
- A separate route for the publishing editor.

## Data Model

The central model is `WordPressClassicPostDraft`.

```ts
type WordPressClassicPostDraft = {
  identity: {
    localDraftId: string;
    calendarItemId?: string;
    contentDraftId?: string;
    externalId: string;
  };
  editor: {
    title: string;
    slug: string;
    contentHtml: string;
    excerpt: string;
  };
  publish: {
    postType: "post" | "page";
    status: "draft" | "pending";
    scheduledAt?: string;
  };
  taxonomy: {
    categories: string[];
    tags: string[];
  };
  yoast: {
    focusKeyphrase: string;
    seoTitle: string;
    metaDescription: string;
    canonical: string;
    robots: string;
  };
  sync: {
    wpPostId?: number;
    editUrl?: string;
    lastSyncedAt?: string;
    lastSyncStatus: "idle" | "syncing" | "synced" | "error";
    lastSyncError?: string;
  };
};
```

## WordPress Payload

The internal model is richer than the plugin payload. The frontend should map the draft into this stable payload shape:

```json
{
  "external_id": "openseo_draft_123",
  "post_type": "post",
  "title": "כותרת",
  "slug": "slug",
  "content_html": "<h1>...</h1>",
  "excerpt": "תקציר",
  "status": "draft",
  "scheduled_at": "",
  "categories": ["SEO"],
  "tags": ["Yoast", "WordPress"],
  "yoast": {
    "focus_keyphrase": "מילת מפתח",
    "seo_title": "כותרת SEO",
    "meta_description": "תיאור מטא",
    "canonical": "",
    "robots": ""
  }
}
```

The old `seo` payload shape can remain as a temporary compatibility path in the plugin mapper. The new frontend flow should emit `yoast`.

## UI Structure

Recommended frontend files:

- `src/client/features/content/classicEditorModel.ts`
- `src/client/features/content/classicEditorModel.test.ts`
- `src/client/features/content/ClassicEditorWorkspace.tsx`
- `src/client/features/content/ClassicEditorTitlePanel.tsx`
- `src/client/features/content/ClassicEditorContentPanel.tsx`
- `src/client/features/content/ClassicEditorPublishBox.tsx`
- `src/client/features/content/ClassicEditorTaxonomyBox.tsx`
- `src/client/features/content/YoastSeoBox.tsx`

The existing `WordPressPublishSection` should not keep growing. It should either be replaced by the new editor or left only as a small compatibility wrapper during migration.

The publishing editor layout:

- Title and permalink at the top.
- Main content editor in the center.
- Publish, categories, and tags boxes in a WordPress-style sidebar.
- Yoast SEO box below the content editor.
- Local save and payload/sync actions in the publish box.

The UI should remain clean and readable. It does not need final brand styling in this phase.

## Persistence

Classic editor drafts are stored in `localStorage` for this phase.

Storage key pattern:

```text
openseo:{projectId}:{userKey}:classic-editor-drafts
```

Draft lookup rules:

- Prefer an existing draft matching `calendarItemId` and `contentDraftId`.
- If no exact AI draft match exists, fall back to the most recent draft for the `calendarItemId`.
- If no draft exists, create a new local draft.

This keeps the model ready for database persistence later without introducing DB work now.

## WordPress Plugin Contract

The plugin mapper should support:

- `yoast.focus_keyphrase`
- `yoast.seo_title`
- `yoast.meta_description`
- `yoast.canonical`
- `yoast.robots`

The MVP Yoast meta fields are:

- `_yoast_wpseo_title`
- `_yoast_wpseo_metadesc`
- `_yoast_wpseo_focuskw`
- `_yoast_wpseo_canonical`

The plugin response should include:

- `ok`
- `post_id`
- `status`
- `edit_url`
- `updated_existing`

Real sync can remain limited if connecting the endpoint would make this phase too broad. The frontend model and payload must still be ready for the real sync path.

## Testing

Add tests for:

- Creating a classic editor draft from a calendar item and AI draft.
- Preserving the display title while normalizing only the slug.
- Mapping categories and tags as arrays.
- Mapping Yoast fields into the new `yoast` payload shape.
- Keeping `external_id` stable for repeated drafts.
- Parsing stored local drafts defensively.
- Maintaining compatibility with Hebrew text.

## Design Deferred

Full brand design is intentionally deferred.

After this functional flow is implemented, the next design phase should define:

- logo or wordmark
- color palette
- typography
- full design system
- polished editor surface
- empty, loading, saved, error, and synced states
- mobile polish

The reason to defer this is product clarity: once the whole flow exists, the design layer can respond to real states and interactions instead of guessing from a wireframe.
