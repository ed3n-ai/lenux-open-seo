import type { DomainRankedKeywordItem } from "@/server/lib/dataforseo";

export type PageKeyword = {
  keyword: string;
  position: number | null;
  searchVolume: number | null;
  traffic: number | null;
  cpc: number | null;
  keywordDifficulty: number | null;
  rankingUrl: string | null;
};

export type PageIntelligencePage = {
  url: string;
  title: string | null;
  h1: string | null;
  metaDescription: string | null;
  canonical: string | null;
  statusCode: number | null;
  wordCount: number;
  topKeywords: PageKeyword[];
};

export type CannibalizationIssue = {
  keyword: string;
  severity: "high" | "medium" | "low";
  pages: Array<{
    url: string;
    title: string | null;
    position: number | null;
    traffic: number | null;
  }>;
};

export function normalizeComparableUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    parsed.hash = "";
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.searchParams.sort();

    if (parsed.pathname.endsWith("/") && parsed.pathname !== "/") {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function mapRankedKeywordItem(
  item: DomainRankedKeywordItem,
): PageKeyword | null {
  const keywordData = item.keyword_data;
  const keywordInfo = keywordData?.keyword_info;
  const keywordProperties = keywordData?.keyword_properties;
  const rankedSerpElement = item.ranked_serp_element;
  const serpItem = rankedSerpElement?.serp_item;
  const keyword = keywordData?.keyword ?? item.keyword;
  if (!keyword) return null;

  const position =
    serpItem?.rank_absolute ??
    rankedSerpElement?.rank_absolute ??
    item.rank_absolute ??
    null;
  const traffic = serpItem?.etv ?? rankedSerpElement?.etv ?? item.etv ?? null;
  const keywordDifficulty =
    keywordInfo?.keyword_difficulty ??
    keywordProperties?.keyword_difficulty ??
    item.keyword_difficulty ??
    null;

  return {
    keyword,
    position: position != null ? Math.round(position) : null,
    searchVolume:
      keywordInfo?.search_volume != null
        ? Math.round(keywordInfo.search_volume)
        : null,
    traffic,
    cpc: keywordInfo?.cpc ?? null,
    keywordDifficulty:
      keywordDifficulty != null ? Math.round(keywordDifficulty) : null,
    rankingUrl: serpItem?.url ?? rankedSerpElement?.url ?? null,
  };
}

export function detectCannibalization(
  pages: PageIntelligencePage[],
): CannibalizationIssue[] {
  const byKeyword = new Map<
    string,
    Array<{
      url: string;
      title: string | null;
      position: number | null;
      traffic: number | null;
    }>
  >();

  for (const page of pages) {
    for (const keyword of page.topKeywords) {
      const normalizedKeyword = keyword.keyword.trim().toLowerCase();
      if (!normalizedKeyword) continue;

      const pageEntry = {
        url: page.url,
        title: page.title,
        position: keyword.position,
        traffic: keyword.traffic,
      };
      const entries = byKeyword.get(normalizedKeyword) ?? [];
      if (!entries.some((entry) => entry.url === page.url)) {
        entries.push(pageEntry);
      }
      byKeyword.set(normalizedKeyword, entries);
    }
  }

  return Array.from(byKeyword.entries())
    .filter(([, pagesForKeyword]) => pagesForKeyword.length > 1)
    .map(([keyword, pagesForKeyword]) => {
      const sortedPages = pagesForKeyword.sort((a, b) => {
        const aPosition = a.position ?? Number.POSITIVE_INFINITY;
        const bPosition = b.position ?? Number.POSITIVE_INFINITY;
        return aPosition - bPosition;
      });
      const bestTwo = sortedPages.slice(0, 2);
      const bestPosition = Math.min(
        ...bestTwo.map((page) => page.position ?? Number.POSITIVE_INFINITY),
      );
      const secondPosition =
        bestTwo[1]?.position ?? Number.POSITIVE_INFINITY;

      const severity: CannibalizationIssue["severity"] =
        bestPosition <= 20 && secondPosition <= 20
          ? "high"
          : bestPosition <= 50 && secondPosition <= 50
            ? "medium"
            : "low";

      return {
        keyword,
        severity,
        pages: sortedPages,
      };
    })
    .sort((a, b) => {
      const severityWeight = { high: 0, medium: 1, low: 2 };
      return severityWeight[a.severity] - severityWeight[b.severity];
    });
}

export function choosePrimaryKeyword(
  keywords: PageKeyword[],
): PageKeyword | null {
  return (
    [...keywords].sort((a, b) => {
      const aPosition = a.position ?? Number.POSITIVE_INFINITY;
      const bPosition = b.position ?? Number.POSITIVE_INFINITY;
      if (aPosition !== bPosition) return aPosition - bPosition;
      return (b.traffic ?? 0) - (a.traffic ?? 0);
    })[0] ?? null
  );
}
