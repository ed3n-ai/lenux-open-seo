import { describe, expect, test } from "vitest";
import {
  addUniqueIdeas,
  buildPublicationPayload,
  createCalendarItem,
  createCalendarItemFromDraft,
  createContentIdeas,
  parseStoredRole,
} from "./contentManagerStorage";

describe("contentManagerStorage", () => {
  test("accepts only known workflow roles", () => {
    expect(parseStoredRole("content-manager")).toBe("content-manager");
    expect(parseStoredRole("seo-operator")).toBe("seo-operator");
    expect(parseStoredRole("admin")).toBeNull();
    expect(parseStoredRole(null)).toBeNull();
  });

  test("creates practical content ideas from a direction brief", () => {
    const ideas = createContentIdeas({
      audience: "מנהלי שיווק",
      domain: "מחקר מילות מפתח",
      goal: "traffic",
      language: "עברית",
      tone: "מקצועי",
    });

    expect(ideas).toHaveLength(3);
    expect(ideas[0]).toMatchObject({
      primaryKeyword: "מחקר מילות מפתח",
      contentType: "מדריך",
      intent: "למידה והשוואה",
    });
    expect(ideas[0]?.secondaryKeywords).toContain("מנהלי שיווק");
  });

  test("adds selected ideas without duplicating existing ids", () => {
    const ideas = createContentIdeas({
      audience: "לקוחות",
      domain: "SEO טכני",
      goal: "authority",
      language: "עברית",
      tone: "ברור",
    });

    expect(addUniqueIdeas([ideas[0]], ideas)).toHaveLength(3);
  });

  test("creates a planned calendar item from an idea", () => {
    const [idea] = createContentIdeas({
      audience: "לקוחות",
      domain: "כתיבת תוכן",
      goal: "leads",
      language: "עברית",
      tone: "ברור",
    });

    const item = createCalendarItem(idea, "2026-05-20");

    expect(item.status).toBe("planned");
    expect(item.dueDate).toBe("2026-05-20");
  });

  test("creates an editor-ready calendar item for standalone AI drafts", () => {
    const item = createCalendarItemFromDraft({
      id: "draft-123",
      title: "מדריך AI למנהלי תוכן",
    });

    expect(item).toMatchObject({
      id: "standalone-draft-123",
      title: "מדריך AI למנהלי תוכן",
      primaryKeyword: "מדריך AI למנהלי תוכן",
      contentType: "טיוטת AI",
      status: "editing",
    });
    expect(item.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("builds a WordPress and Yoast publication payload", () => {
    const payload = buildPublicationPayload({
      canonical: "https://example.com/seo-guide",
      categories: "SEO, תוכן",
      contentHtml: "<h1>מדריך SEO</h1>",
      excerpt: "תקציר",
      focusKeyword: "מדריך SEO",
      metaDescription: "תיאור מטא",
      metaTitle: "כותרת SEO",
      postType: "post",
      robots: "index,follow",
      slug: "מדריך SEO",
      status: "draft",
      tags: "Yoast, WordPress",
      title: "מדריך SEO",
    });

    expect(payload).toMatchObject({
      external_id: "openseo_מדריך-seo",
      post_type: "post",
      status: "draft",
      categories: ["SEO", "תוכן"],
      tags: ["Yoast", "WordPress"],
      seo: {
        focus_keyword: "מדריך SEO",
        meta_description: "תיאור מטא",
        meta_title: "כותרת SEO",
      },
    });
  });

  test("keeps display quotes in titles while normalizing quoted slugs", () => {
    const payload = buildPublicationPayload({
      canonical: "",
      categories: "",
      contentHtml: "<h1>מדריך</h1>",
      excerpt: "",
      focusKeyword: "SEO",
      metaDescription: "",
      metaTitle: 'מדריך "SEO"',
      postType: "post",
      robots: "",
      slug: 'מדריך "SEO" לצ\'קליסט',
      status: "draft",
      tags: "",
      title: 'מדריך "SEO" לצ\'קליסט',
    });

    expect(payload.title).toBe('מדריך "SEO" לצ\'קליסט');
    expect(payload.slug).toBe("מדריך-seo-לצקליסט");
    expect(payload.external_id).toBe("openseo_מדריך-seo-לצקליסט");
  });
});
