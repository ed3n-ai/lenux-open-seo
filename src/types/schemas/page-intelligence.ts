import { z } from "zod";

export const pageIntelligenceSearchSchema = z.object({
  source: z.string().optional(),
  loc: z.number().int().optional(),
});

export const analyzePageIntelligenceSchema = z.object({
  projectId: z.string().min(1),
  source: z.string().url(),
  mode: z.enum(["auto", "sitemap", "url"]).default("auto"),
  locationCode: z.number().int().positive().default(2376),
  languageCode: z.string().min(2).max(8).default("he"),
  maxPages: z.number().int().min(1).max(20).default(8),
  keywordsPerPage: z.number().int().min(3).max(20).default(8),
});

export type AnalyzePageIntelligenceInput = z.infer<
  typeof analyzePageIntelligenceSchema
>;
