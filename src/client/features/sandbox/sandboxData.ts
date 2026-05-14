import {
  BarChart3,
  ClipboardCheck,
  Search,
  TrendingUp,
} from "lucide-react";

export type SandboxScenario = "keywords" | "domain" | "rank" | "audit";

export type SandboxState = {
  scenario: SandboxScenario;
  domain: string;
  market: string;
  depth: number;
  lastRunAt: string | null;
};

export type SandboxKeyword = {
  keyword: string;
  intent: string;
  volume: number;
  difficulty: number;
  opportunity: number;
};

export const STORAGE_KEY = "openseo-client-sandbox";

export const scenarios = [
  { id: "keywords", label: "Keywords", icon: Search },
  { id: "domain", label: "Domain", icon: BarChart3 },
  { id: "rank", label: "Rank", icon: TrendingUp },
  { id: "audit", label: "Audit", icon: ClipboardCheck },
] as const;

export const defaultState: SandboxState = {
  scenario: "keywords",
  domain: "example.com",
  market: "United States",
  depth: 20,
  lastRunAt: null,
};

export const baseKeywords: SandboxKeyword[] = [
  {
    keyword: "technical seo audit",
    intent: "Commercial",
    volume: 5400,
    difficulty: 41,
    opportunity: 82,
  },
  {
    keyword: "rank tracking software",
    intent: "Commercial",
    volume: 3600,
    difficulty: 53,
    opportunity: 74,
  },
  {
    keyword: "backlink checker",
    intent: "Transactional",
    volume: 14800,
    difficulty: 68,
    opportunity: 61,
  },
  {
    keyword: "seo content brief",
    intent: "Informational",
    volume: 1900,
    difficulty: 33,
    opportunity: 88,
  },
];

export const scenarioCopy: Record<
  SandboxScenario,
  {
    title: string;
    description: string;
    primaryMetric: string;
    secondaryMetric: string;
  }
> = {
  keywords: {
    title: "Keyword research workspace",
    description: "Mock demand, intent, difficulty, and prioritization signals.",
    primaryMetric: "25.7k",
    secondaryMetric: "Tracked demand",
  },
  domain: {
    title: "Domain overview workspace",
    description: "Mock visibility, top pages, traffic movement, and gaps.",
    primaryMetric: "+18%",
    secondaryMetric: "Visibility delta",
  },
  rank: {
    title: "Rank tracking workspace",
    description: "Mock positions across desktop, mobile, and SERP features.",
    primaryMetric: "7.4",
    secondaryMetric: "Avg. position",
  },
  audit: {
    title: "Site audit workspace",
    description: "Mock crawl health, Lighthouse scores, and issue groups.",
    primaryMetric: "91",
    secondaryMetric: "Health score",
  },
};
