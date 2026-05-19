import { beforeEach, describe, expect, test, vi } from "vitest";
import { ContentWriterService } from "./ContentWriterService";
import { ContentRepository } from "@/server/features/content/repositories/ContentRepository";
import { generateOpenAIContentDraft } from "@/server/lib/openai";

vi.mock("@/server/features/content/repositories/ContentRepository", () => ({
  ContentRepository: {
    addUsage: vi.fn(),
    createDraft: vi.fn(),
    getUsage: vi.fn(),
    listRecentDrafts: vi.fn(),
  },
}));

vi.mock("@/server/lib/openai", () => ({
  generateOpenAIContentDraft: vi.fn(),
}));

const context = {
  organizationId: "org-1",
  projectId: "project-1",
  userEmail: "user@example.com",
  userId: "user-1",
};

describe("ContentWriterService", () => {
  beforeEach(() => {
    vi.mocked(ContentRepository.addUsage).mockReset();
    vi.mocked(ContentRepository.createDraft).mockReset();
    vi.mocked(ContentRepository.getUsage).mockReset();
    vi.mocked(ContentRepository.listRecentDrafts).mockReset();
    vi.mocked(generateOpenAIContentDraft).mockReset();
  });

  test("generates, stores, and returns an OpenAI-backed draft with SEO metadata", async () => {
    vi.mocked(ContentRepository.getUsage).mockResolvedValue(undefined);
    vi.mocked(generateOpenAIContentDraft).mockResolvedValue({
      focusKeyphrase: "מילות מפתח",
      markdown: "# איך לבחור מילות מפתח\n\n" + "ערך מעשי ".repeat(120),
      metaDescription:
        "מדריך מעשי לבחירת מילות מפתח לפי כוונת חיפוש וערך עסקי.",
      seoTitle: "איך לבחור מילות מפתח | OpenSEO",
      title: "איך לבחור מילות מפתח",
    });

    const result = await ContentWriterService.generateDraft(context, {
      keywords: ["מילות מפתח"],
      language: "he",
      projectId: "project-1",
      targetWords: 1000,
      tone: "expert",
      topic: "איך לבחור מילות מפתח",
    });

    expect(result.draft).toMatchObject({
      focusKeyphrase: "מילות מפתח",
      metaDescription:
        "מדריך מעשי לבחירת מילות מפתח לפי כוונת חיפוש וערך עסקי.",
      seoTitle: "איך לבחור מילות מפתח | OpenSEO",
      title: "איך לבחור מילות מפתח",
    });
    expect(ContentRepository.createDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining("# איך לבחור מילות מפתח"),
        focusKeyphrase: "מילות מפתח",
        metaDescription:
          "מדריך מעשי לבחירת מילות מפתח לפי כוונת חיפוש וערך עסקי.",
        organizationId: "org-1",
        projectId: "project-1",
        seoTitle: "איך לבחור מילות מפתח | OpenSEO",
      }),
    );
    expect(ContentRepository.addUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        words: result.draft.wordCount,
      }),
    );
  });

  test("does not call OpenAI when the requested draft exceeds the monthly limit", async () => {
    vi.mocked(ContentRepository.getUsage).mockResolvedValue({
      id: 1,
      monthKey: "2026-05",
      organizationId: "org-1",
      updatedAt: "2026-05-19T00:00:00.000Z",
      wordsUsed: 9800,
    });

    await expect(
      ContentWriterService.generateDraft(context, {
        keywords: [],
        language: "he",
        projectId: "project-1",
        targetWords: 1000,
        tone: "clear",
        topic: "כתיבת תוכן",
      }),
    ).rejects.toMatchObject({
      code: "CONTENT_WORD_LIMIT_REACHED",
    });

    expect(generateOpenAIContentDraft).not.toHaveBeenCalled();
  });
});
