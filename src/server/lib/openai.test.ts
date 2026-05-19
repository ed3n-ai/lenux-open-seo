import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { generateOpenAIContentDraft } from "./openai";

const draftPayload = {
  focusKeyphrase: "מנוע כתיבה AI",
  markdown: "# מנוע כתיבה AI\n\n" + "תוכן איכותי ".repeat(60),
  metaDescription:
    "מדריך קצר וברור לבניית מנוע כתיבה איכותי עם AI, כולל מבנה, ערך לקורא ושדות SEO.",
  seoTitle: "מנוע כתיבה AI | מדריך מעשי",
  title: "איך לבנות מנוע כתיבה AI איכותי",
};

describe("generateOpenAIContentDraft", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-openai-key";
    delete process.env.OPENAI_CONTENT_MODEL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_CONTENT_MODEL;
  });

  test("calls the Responses API with structured output and parses the draft", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe("gpt-5");
      expect(body.max_output_tokens).toBe(8000);
      expect(body.reasoning.effort).toBe("minimal");
      expect(body.text.format.type).toBe("json_schema");
      expect(body.text.format.strict).toBe(true);
      expect(body.input[1].content).toContain(
        "Target length: about 1000 words",
      );

      return new Response(
        JSON.stringify({ output_text: JSON.stringify(draftPayload) }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateOpenAIContentDraft({
      keywords: ["מנוע כתיבה AI"],
      language: "he",
      projectId: "project-1",
      targetWords: 1000,
      tone: "expert",
      topic: "איך לבנות מנוע כתיבה AI איכותי",
    });

    expect(result).toEqual({
      ...draftPayload,
      markdown: draftPayload.markdown.trim(),
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-openai-key",
        }),
        method: "POST",
      }),
    );
  });

  test("throws a product error when the OpenAI key is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(
      generateOpenAIContentDraft({
        keywords: [],
        language: "he",
        projectId: "project-1",
        targetWords: 1000,
        tone: "clear",
        topic: "כתיבת תוכן",
      }),
    ).rejects.toMatchObject({
      code: "CONTENT_AI_CONFIG_MISSING",
    });
  });
});
