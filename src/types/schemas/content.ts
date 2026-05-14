import { z } from "zod";

export const CONTENT_MONTHLY_WORD_LIMIT = 10000;

export const getContentWriterStatusSchema = z.object({
  projectId: z.string().min(1),
});

export const getContentDraftSchema = z.object({
  projectId: z.string().min(1),
  draftId: z.string().min(1),
});

export const generateContentDraftSchema = z.object({
  projectId: z.string().min(1),
  topic: z.string().trim().min(3).max(180),
  language: z.enum(["he", "en"]).default("he"),
  tone: z.enum(["clear", "expert", "friendly", "persuasive"]).default("clear"),
  keywords: z
    .array(z.string().trim().min(1).max(80))
    .max(8)
    .default([])
    .transform((keywords) => [...new Set(keywords)]),
  targetWords: z.number().int().min(150).max(2500).default(1000),
});

export type GenerateContentDraftInput = z.infer<
  typeof generateContentDraftSchema
>;
export type GetContentDraftInput = z.infer<typeof getContentDraftSchema>;
export type GetContentWriterStatusInput = z.infer<
  typeof getContentWriterStatusSchema
>;
