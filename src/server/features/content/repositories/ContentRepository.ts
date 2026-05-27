import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { contentDrafts, contentUsage } from "@/db/schema";

async function getUsage(organizationId: string, monthKey: string) {
  return db.query.contentUsage.findFirst({
    where: and(
      eq(contentUsage.organizationId, organizationId),
      eq(contentUsage.monthKey, monthKey),
    ),
  });
}

async function addUsage(params: {
  organizationId: string;
  monthKey: string;
  words: number;
}) {
  await db
    .insert(contentUsage)
    .values({
      organizationId: params.organizationId,
      monthKey: params.monthKey,
      wordsUsed: params.words,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: [contentUsage.organizationId, contentUsage.monthKey],
      set: {
        wordsUsed: sql`${contentUsage.wordsUsed} + ${params.words}`,
        updatedAt: new Date().toISOString(),
      },
    });
}

async function createDraft(params: {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  topic: string;
  audience: string;
  tone: string;
  keywords: string[];
  content: string;
  focusKeyphrase: string;
  metaDescription: string;
  seoTitle: string;
  wordCount: number;
}) {
  await db.insert(contentDrafts).values({
    id: params.id,
    organizationId: params.organizationId,
    projectId: params.projectId,
    title: params.title,
    topic: params.topic,
    audience: params.audience,
    tone: params.tone,
    keywordsJson: JSON.stringify(params.keywords),
    content: params.content,
    focusKeyphrase: params.focusKeyphrase,
    metaDescription: params.metaDescription,
    seoTitle: params.seoTitle,
    wordCount: params.wordCount,
  });
}

async function getDraft(projectId: string, draftId: string) {
  return db.query.contentDrafts.findFirst({
    where: and(
      eq(contentDrafts.projectId, projectId),
      eq(contentDrafts.id, draftId),
    ),
  });
}

async function deleteDraft(projectId: string, draftId: string) {
  await db
    .delete(contentDrafts)
    .where(
      and(eq(contentDrafts.projectId, projectId), eq(contentDrafts.id, draftId)),
    );
}

async function listRecentDrafts(projectId: string) {
  return db.query.contentDrafts.findMany({
    where: eq(contentDrafts.projectId, projectId),
    orderBy: desc(contentDrafts.createdAt),
    limit: 5,
  });
}

export const ContentRepository = {
  addUsage,
  createDraft,
  deleteDraft,
  getDraft,
  getUsage,
  listRecentDrafts,
} as const;
