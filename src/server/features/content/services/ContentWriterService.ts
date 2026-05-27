import { CONTENT_MONTHLY_WORD_LIMIT } from "@/types/schemas/content";
import type { GenerateContentDraftInput } from "@/types/schemas/content";
import type { EnsuredUserContext } from "@/middleware/ensure-user/types";
import { AppError } from "@/server/lib/errors";
import { ContentRepository } from "@/server/features/content/repositories/ContentRepository";
import { generateOpenAIContentDraft } from "@/server/lib/openai";

type ContentProjectContext = EnsuredUserContext & {
  projectId: string;
};

function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function countWords(text: string) {
  const matches = text.trim().match(/\S+/g);
  return matches?.length ?? 0;
}

function trimToWordLimit(text: string, limit: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return text.trim();
  return `${words.slice(0, limit).join(" ")}.`;
}

function toTitle(topic: string) {
  if (/[\u0590-\u05ff]/.test(topic)) {
    return topic.trim();
  }

  return topic
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

async function getUsageSummary(organizationId: string) {
  const monthKey = getMonthKey();
  const usage = await ContentRepository.getUsage(organizationId, monthKey);
  const wordsUsed = usage?.wordsUsed ?? 0;

  return {
    limit: CONTENT_MONTHLY_WORD_LIMIT,
    monthKey,
    remaining: Math.max(0, CONTENT_MONTHLY_WORD_LIMIT - wordsUsed),
    wordsUsed,
  };
}

async function generateDraft(
  context: ContentProjectContext,
  input: GenerateContentDraftInput,
) {
  const usage = await getUsageSummary(context.organizationId);
  if (input.targetWords > usage.remaining) {
    throw new AppError(
      "CONTENT_WORD_LIMIT_REACHED",
      `This draft needs ${input.targetWords} words, but only ${usage.remaining} remain this month.`,
    );
  }

  const generated = await generateOpenAIContentDraft(input);
  const content = trimToWordLimit(
    generated.markdown,
    Math.min(usage.remaining, Math.ceil(input.targetWords * 1.15)),
  );
  const wordCount = countWords(content);
  if (wordCount > usage.remaining) {
    throw new AppError("CONTENT_WORD_LIMIT_REACHED");
  }

  const id = crypto.randomUUID();
  const title = generated.title || toTitle(input.topic);
  await ContentRepository.createDraft({
    id,
    organizationId: context.organizationId,
    projectId: context.projectId,
    title,
    topic: input.topic,
    audience: input.language === "he" ? "כללי" : "general",
    tone: input.tone,
    keywords: input.keywords,
    content,
    focusKeyphrase:
      generated.focusKeyphrase || input.keywords[0] || input.topic,
    metaDescription: generated.metaDescription,
    seoTitle: generated.seoTitle,
    wordCount,
  });
  await ContentRepository.addUsage({
    organizationId: context.organizationId,
    monthKey: usage.monthKey,
    words: wordCount,
  });

  return {
    draft: {
      id,
      title,
      content,
      focusKeyphrase: generated.focusKeyphrase,
      metaDescription: generated.metaDescription,
      seoTitle: generated.seoTitle,
      wordCount,
    },
    usage: {
      ...usage,
      wordsUsed: usage.wordsUsed + wordCount,
      remaining: Math.max(0, usage.remaining - wordCount),
    },
  };
}

async function getDraft(projectId: string, draftId: string) {
  const row = await ContentRepository.getDraft(projectId, draftId);
  if (!row) {
    throw new AppError("NOT_FOUND");
  }

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    focusKeyphrase: row.focusKeyphrase,
    metaDescription: row.metaDescription,
    seoTitle: row.seoTitle,
    wordCount: row.wordCount,
    createdAt: row.createdAt,
  };
}

async function deleteDraft(projectId: string, draftId: string) {
  const row = await ContentRepository.getDraft(projectId, draftId);
  if (!row) {
    throw new AppError("NOT_FOUND");
  }

  await ContentRepository.deleteDraft(projectId, draftId);
  return { deleted: true };
}

async function listRecentDrafts(projectId: string) {
  const rows = await ContentRepository.listRecentDrafts(projectId);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    wordCount: row.wordCount,
    createdAt: row.createdAt,
  }));
}

export const ContentWriterService = {
  deleteDraft,
  generateDraft,
  getDraft,
  getUsageSummary,
  listRecentDrafts,
} as const;
