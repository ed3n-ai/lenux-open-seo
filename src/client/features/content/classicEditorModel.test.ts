import { describe, expect, test } from "vitest";
import type { ContentCalendarItem } from "./contentManagerStorage";
import {
  buildClassicEditorPayload,
  createClassicEditorDraft,
  parseStoredClassicEditorDrafts,
  upsertClassicEditorDraft,
} from "./classicEditorModel";

const calendarItem = {
  contentType: "מדריך",
  dueDate: "2026-05-20",
  goal: "traffic",
  id: "keyword-guide",
  intent: "למידה",
  notes: "תקציר לרעיון",
  primaryKeyword: "מחקר מילות מפתח",
  secondaryKeywords: ["SEO", "Yoast"],
  status: "planned",
  title: 'איך לבחור "מילות מפתח" לקידום אורגני',
} satisfies ContentCalendarItem;

describe("classicEditorModel", () => {
  test("creates a classic editor draft from a calendar item and AI draft", () => {
    const draft = createClassicEditorDraft({
      calendarItem,
      contentDraft: {
        content: "# פתיחה\n\nגוף הטיוטה",
        focusKeyphrase: "מילות מפתח אורגניות",
        id: "ai-draft-1",
        metaDescription: "תיאור מטא שנוצר במנוע הכתיבה",
        seoTitle: "כותרת SEO מטיוטת AI",
        title: "כותרת מטיוטת AI",
      },
    });

    expect(draft.identity).toMatchObject({
      calendarItemId: "keyword-guide",
      contentDraftId: "ai-draft-1",
      externalId: "openseo_keyword-guide_ai-draft-1",
      localDraftId: "classic_keyword-guide_ai-draft-1",
    });
    expect(draft.editor.title).toBe("כותרת מטיוטת AI");
    expect(draft.editor.contentHtml).toContain("<h1>פתיחה</h1>");
    expect(draft.taxonomy).toEqual({
      categories: ["SEO"],
      tags: ["SEO", "Yoast"],
    });
    expect(draft.yoast).toMatchObject({
      focusKeyphrase: "מילות מפתח אורגניות",
      metaDescription: "תיאור מטא שנוצר במנוע הכתיבה",
      seoTitle: "כותרת SEO מטיוטת AI",
    });
  });

  test("keeps display title readable while normalizing slug only", () => {
    const draft = createClassicEditorDraft({
      calendarItem,
      contentDraft: null,
    });

    expect(draft.editor.title).toBe('איך לבחור "מילות מפתח" לקידום אורגני');
    expect(draft.editor.slug).toBe("איך-לבחור-מילות-מפתח-לקידום-אורגני");
  });

  test("maps a classic editor draft to the WordPress Yoast payload", () => {
    const draft = createClassicEditorDraft({
      calendarItem,
      contentDraft: {
        content: "תוכן רגיל",
        id: "ai-draft-1",
        title: "כותרת",
      },
    });

    const payload = buildClassicEditorPayload({
      ...draft,
      editor: {
        ...draft.editor,
        excerpt: "תקציר",
      },
      publish: {
        ...draft.publish,
        scheduledAt: "2026-05-22T08:30",
      },
      yoast: {
        ...draft.yoast,
        canonical: "https://example.com/post",
        robots: "index,follow",
      },
    });

    expect(payload).toMatchObject({
      external_id: "openseo_keyword-guide_ai-draft-1",
      post_type: "post",
      scheduled_at: "2026-05-22T08:30",
      title: "כותרת",
      yoast: {
        canonical: "https://example.com/post",
        focus_keyphrase: "מחקר מילות מפתח",
        robots: "index,follow",
        seo_title: "כותרת",
      },
    });
  });

  test("parses stored drafts defensively and upserts by local draft id", () => {
    const draft = createClassicEditorDraft({
      calendarItem,
      contentDraft: null,
    });

    expect(parseStoredClassicEditorDrafts("not-json")).toEqual([]);
    expect(
      parseStoredClassicEditorDrafts(JSON.stringify([{ bad: true }])),
    ).toEqual([]);

    const updated = {
      ...draft,
      editor: { ...draft.editor, title: "עודכן" },
    };

    expect(upsertClassicEditorDraft([draft], updated)).toEqual([updated]);
  });
});
