import { describe, expect, it } from "vitest";
import {
  detectCannibalization,
  mapRankedKeywordItem,
  normalizeComparableUrl,
} from "./pageIntelligenceModel";

describe("page intelligence model", () => {
  it("normalizes comparable URLs without fragments or trailing slashes", () => {
    expect(
      normalizeComparableUrl(
        "https://Example.com/blog/post/?utm_source=x#section",
      ),
    ).toBe("https://example.com/blog/post?utm_source=x");
    expect(normalizeComparableUrl("https://example.com/blog/post/")).toBe(
      "https://example.com/blog/post",
    );
  });

  it("maps DataForSEO ranked keyword payloads into stable keyword records", () => {
    const mapped = mapRankedKeywordItem({
      keyword_data: {
        keyword: "מנוע כתיבה AI",
        keyword_info: {
          search_volume: 140,
          cpc: 1.25,
          keyword_difficulty: 31,
        },
      },
      ranked_serp_element: {
        serp_item: {
          url: "https://example.com/blog/ai-writing",
          rank_absolute: 7,
          etv: 12.8,
        },
      },
    });

    expect(mapped).toEqual({
      keyword: "מנוע כתיבה AI",
      position: 7,
      searchVolume: 140,
      traffic: 12.8,
      cpc: 1.25,
      keywordDifficulty: 31,
      rankingUrl: "https://example.com/blog/ai-writing",
    });
  });

  it("detects cannibalization when the same keyword ranks on multiple pages", () => {
    const issues = detectCannibalization([
      {
        url: "https://example.com/blog/a",
        title: "A",
        h1: "A",
        metaDescription: null,
        canonical: null,
        statusCode: 200,
        wordCount: 600,
        topKeywords: [
          {
            keyword: "seo ai",
            position: 8,
            searchVolume: 300,
            traffic: 20,
            cpc: null,
            keywordDifficulty: null,
            rankingUrl: "https://example.com/blog/a",
          },
        ],
      },
      {
        url: "https://example.com/blog/b",
        title: "B",
        h1: "B",
        metaDescription: null,
        canonical: null,
        statusCode: 200,
        wordCount: 500,
        topKeywords: [
          {
            keyword: "seo ai",
            position: 12,
            searchVolume: 300,
            traffic: 9,
            cpc: null,
            keywordDifficulty: null,
            rankingUrl: "https://example.com/blog/b",
          },
        ],
      },
    ]);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      keyword: "seo ai",
      severity: "high",
      pages: [
        { url: "https://example.com/blog/a", position: 8 },
        { url: "https://example.com/blog/b", position: 12 },
      ],
    });
  });
});
