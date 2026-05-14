import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";
import { discoverUrls } from "@/server/lib/audit/discovery";
import { getOrigin, normalizeUrl } from "@/server/lib/audit/url-utils";
import type { BillingCustomerContext } from "@/server/billing/subscription";
import { createDataforseoClient } from "@/server/lib/dataforseoClient";
import type { AnalyzePageIntelligenceInput } from "@/types/schemas/page-intelligence";
import {
  choosePrimaryKeyword,
  detectCannibalization,
  mapRankedKeywordItem,
  normalizeComparableUrl,
  type CannibalizationIssue,
  type PageIntelligencePage,
  type PageKeyword,
} from "./pageIntelligenceModel";

type PageIntelligenceResult = {
  source: string;
  scannedAt: string;
  pagesAnalyzed: number;
  keywordsFound: number;
  cannibalizationCount: number;
  dataStatus: "complete" | "partial";
  warnings: string[];
  pages: Array<
    PageIntelligencePage & {
      primaryKeyword: PageKeyword | null;
      opportunityCount: number;
      recommendation: string;
    }
  >;
  cannibalizations: CannibalizationIssue[];
};

async function analyze(
  input: AnalyzePageIntelligenceInput,
  billingCustomer: BillingCustomerContext,
): Promise<PageIntelligenceResult> {
  const normalizedSource = normalizeUrl(input.source);
  if (!normalizedSource) {
    throw new Error("Invalid source URL");
  }

  const urls = await discoverInputUrls(normalizedSource, input);
  const uniqueUrls = Array.from(
    new Map(
      urls
        .map((url) => [normalizeComparableUrl(url), url] as const)
        .filter((entry): entry is readonly [string, string] => !!entry[0]),
    ).values(),
  ).slice(0, input.maxPages);

  const dataforseo = createDataforseoClient(billingCustomer);
  const pages: PageIntelligencePage[] = [];
  const warnings: string[] = [];

  for (const url of uniqueUrls) {
    const metadata = await fetchPageMetadata(url);
    const keywords = await fetchPageKeywords({
      dataforseo,
      pageUrl: url,
      locationCode: input.locationCode,
      languageCode: input.languageCode,
      limit: input.keywordsPerPage,
    }).catch((error) => {
      console.warn("page-intelligence keywords fetch failed", { url, error });
      warnings.push(`לא נמצאו נתוני ביטויים עבור ${url}`);
      return [];
    });

    pages.push({
      ...metadata,
      topKeywords: keywords,
    });
  }

  const cannibalizations = detectCannibalization(pages);
  const enrichedPages = pages.map((page) => {
    const primaryKeyword = choosePrimaryKeyword(page.topKeywords);
    const opportunityCount = page.topKeywords.filter((keyword) => {
      const position = keyword.position ?? 0;
      return position >= 4 && position <= 30;
    }).length;

    return {
      ...page,
      primaryKeyword,
      opportunityCount,
      recommendation: buildRecommendation(page, primaryKeyword),
    };
  });

  return {
    source: normalizedSource,
    scannedAt: new Date().toISOString(),
    pagesAnalyzed: enrichedPages.length,
    keywordsFound: enrichedPages.reduce(
      (sum, page) => sum + page.topKeywords.length,
      0,
    ),
    cannibalizationCount: cannibalizations.length,
    dataStatus: warnings.length > 0 ? "partial" : "complete",
    warnings,
    pages: enrichedPages,
    cannibalizations,
  };
}

async function discoverInputUrls(
  source: string,
  input: AnalyzePageIntelligenceInput,
): Promise<string[]> {
  if (input.mode === "sitemap" || isSitemapLike(source)) {
    const sitemapUrls = await fetchUrlsFromSitemap(source);
    if (sitemapUrls.length > 0) return sitemapUrls;
  }

  if (input.mode === "url" || !isSitemapLike(source)) {
    if (input.mode !== "auto") return [source];
    if (!isLikelyDomainRoot(source)) return [source];
  }

  const origin = getOrigin(source);
  const discovered = await discoverUrls(origin, input.maxPages);

  if (isSitemapLike(source) && discovered.urls.length === 0) {
    return [source];
  }

  if (discovered.urls.length > 0) {
    return discovered.urls;
  }

  return [source];
}

async function fetchUrlsFromSitemap(source: string): Promise<string[]> {
  try {
    const response = await fetch(source, {
      headers: { "User-Agent": "OpenSEO-PageIntelligence/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return [];

    const parser = new XMLParser({
      ignoreAttributes: false,
      isArray: (name) => name === "sitemap" || name === "url",
    });
    const parsed = parser.parse(await response.text()) as {
      sitemapindex?: { sitemap?: Array<{ loc?: string }> };
      urlset?: { url?: Array<{ loc?: string }> };
    };

    const pageUrls =
      parsed.urlset?.url
        ?.map((entry) => (entry.loc ? normalizeUrl(entry.loc, source) : null))
        .filter((url): url is string => url !== null) ?? [];
    if (pageUrls.length > 0) return pageUrls;

    const nested =
      parsed.sitemapindex?.sitemap
        ?.map((entry) => (entry.loc ? normalizeUrl(entry.loc, source) : null))
        .filter((url): url is string => url !== null)
        .slice(0, 3) ?? [];
    const nestedResults = await Promise.all(nested.map(fetchUrlsFromSitemap));
    return nestedResults.flat();
  } catch (error) {
    console.warn("page-intelligence sitemap fetch failed", { source, error });
    return [];
  }
}

function isSitemapLike(url: string): boolean {
  const pathname = new URL(url).pathname.toLowerCase();
  return pathname.endsWith(".xml") || pathname.includes("sitemap");
}

function isLikelyDomainRoot(url: string): boolean {
  const parsed = new URL(url);
  return parsed.pathname === "/" || parsed.pathname === "";
}

async function fetchPageMetadata(url: string): Promise<
  Omit<PageIntelligencePage, "topKeywords">
> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "OpenSEO-PageIntelligence/1.0" },
      signal: AbortSignal.timeout(15_000),
    });
    const html = await response.text();
    const $ = cheerio.load(html);
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    return {
      url,
      title: textOrNull($("title").first().text()),
      h1: textOrNull($("h1").first().text()),
      metaDescription: textOrNull(
        $('meta[name="description"]').attr("content") ?? "",
      ),
      canonical: normalizeUrl($('link[rel="canonical"]').attr("href") ?? "", url),
      statusCode: response.status,
      wordCount: bodyText ? bodyText.split(/\s+/).length : 0,
    };
  } catch (error) {
    console.warn("page-intelligence page fetch failed", { url, error });
    return {
      url,
      title: null,
      h1: null,
      metaDescription: null,
      canonical: null,
      statusCode: null,
      wordCount: 0,
    };
  }
}

async function fetchPageKeywords(args: {
  dataforseo: ReturnType<typeof createDataforseoClient>;
  pageUrl: string;
  locationCode: number;
  languageCode: string;
  limit: number;
}): Promise<PageKeyword[]> {
  const comparablePageUrl = normalizeComparableUrl(args.pageUrl);
  const items = await args.dataforseo.domain.rankedKeywords({
    target: args.pageUrl,
    locationCode: args.locationCode,
    languageCode: args.languageCode,
    limit: args.limit,
    orderBy: ["ranked_serp_element.serp_item.rank_absolute,asc"],
  });

  return items
    .map((item) => mapRankedKeywordItem(item))
    .filter((item): item is PageKeyword => item !== null)
    .filter((keyword) => {
      const rankingUrl = keyword.rankingUrl
        ? normalizeComparableUrl(keyword.rankingUrl)
        : comparablePageUrl;
      return !comparablePageUrl || rankingUrl === comparablePageUrl;
    })
    .slice(0, args.limit);
}

function textOrNull(value: string): string | null {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

function buildRecommendation(
  page: PageIntelligencePage,
  primaryKeyword: PageKeyword | null,
): string {
  if (!primaryKeyword) {
    return "אין עדיין ביטוי מוביל ברור. מומלץ להגדיר כוונת חיפוש אחת, לשפר Title/H1, ואז ליצור או לעדכן טיוטה סביב הביטוי המרכזי.";
  }

  const position = primaryKeyword.position;
  if (position != null && position <= 3) {
    return `העמוד כבר חזק על "${primaryKeyword.keyword}". עדיף לשמר מיקוד, לרענן מידע מיושן ולהוסיף קישורים פנימיים מבוקרים.`;
  }

  if (position != null && position <= 20) {
    return `יש הזדמנות לשפר את "${primaryKeyword.keyword}" עם כותרות משנה חדות יותר, הרחבת עומק התוכן וקישור פנימי מעמודים סמוכים.`;
  }

  if (page.wordCount < 500) {
    return "התוכן נראה דק יחסית. כדאי לבנות מחדש מבנה מאמר מלא לפני שמנסים לקדם ביטויים תחרותיים.";
  }

  return `כדאי למקד את העמוד סביב "${primaryKeyword.keyword}", לבדוק חפיפות מול עמודים אחרים ולשפר התאמה לכוונת החיפוש.`;
}

export const PageIntelligenceService = {
  analyze,
} as const;
