import { z } from "zod";

export const CONTENT_MONTHLY_WORD_LIMIT = 10000;

export const getContentWriterStatusSchema = z.object({
  projectId: z.string().min(1),
});

export const getContentDraftSchema = z.object({
  projectId: z.string().min(1),
  draftId: z.string().min(1),
});

export const deleteContentDraftSchema = z.object({
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

export const getWordPressConnectionSchema = z.object({
  projectId: z.string().min(1),
});

export const saveWordPressConnectionSchema = z.object({
  projectId: z.string().min(1),
  displayName: z.string().trim().min(1).max(80).default("Lenux28 SEO"),
  siteUrl: z.string().trim().min(8).max(240),
  sharedSecret: z.string().trim().min(8).max(240).optional(),
});

export const testWordPressConnectionSchema = z.object({
  projectId: z.string().min(1),
});

export const wordpressBridgePayloadSchema = z.object({
  external_id: z.string().min(1),
  post_type: z.enum(["post", "page"]),
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  content_html: z.string().trim().min(1),
  excerpt: z.string().default(""),
  status: z.enum(["draft", "pending"]),
  scheduled_at: z.string().default(""),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  yoast: z.object({
    focus_keyphrase: z.string().default(""),
    seo_title: z.string().default(""),
    meta_description: z.string().default(""),
    canonical: z.string().default(""),
    robots: z.string().default(""),
  }),
});

export const publishWordPressDraftSchema = z.object({
  projectId: z.string().min(1),
  payload: wordpressBridgePayloadSchema,
});

export type GenerateContentDraftInput = z.infer<
  typeof generateContentDraftSchema
>;
export type DeleteContentDraftInput = z.infer<typeof deleteContentDraftSchema>;
export type GetContentDraftInput = z.infer<typeof getContentDraftSchema>;
export type GetContentWriterStatusInput = z.infer<
  typeof getContentWriterStatusSchema
>;
export type GetWordPressConnectionInput = z.infer<
  typeof getWordPressConnectionSchema
>;
export type PublishWordPressDraftInput = z.infer<
  typeof publishWordPressDraftSchema
>;
export type SaveWordPressConnectionInput = z.infer<
  typeof saveWordPressConnectionSchema
>;
export type TestWordPressConnectionInput = z.infer<
  typeof testWordPressConnectionSchema
>;
export type WordPressBridgePayload = z.infer<
  typeof wordpressBridgePayloadSchema
>;
