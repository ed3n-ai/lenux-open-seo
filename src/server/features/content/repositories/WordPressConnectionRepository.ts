import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wordpressSiteConnections } from "@/db/schema";

async function getByProject(projectId: string) {
  return db.query.wordpressSiteConnections.findFirst({
    where: eq(wordpressSiteConnections.projectId, projectId),
  });
}

async function upsert(params: {
  id: string;
  organizationId: string;
  projectId: string;
  displayName: string;
  siteUrl: string;
  sharedSecret: string;
}) {
  const now = new Date().toISOString();
  await db
    .insert(wordpressSiteConnections)
    .values({
      id: params.id,
      organizationId: params.organizationId,
      projectId: params.projectId,
      displayName: params.displayName,
      siteUrl: params.siteUrl,
      sharedSecret: params.sharedSecret,
      lastStatus: "unchecked",
      lastError: null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: wordpressSiteConnections.projectId,
      set: {
        displayName: params.displayName,
        siteUrl: params.siteUrl,
        sharedSecret: params.sharedSecret,
        lastStatus: "unchecked",
        lastError: null,
        updatedAt: now,
      },
    });

  return getByProject(params.projectId);
}

async function updateStatus(params: {
  projectId: string;
  lastStatus: "connected" | "failed";
  lastError?: string | null;
}) {
  const now = new Date().toISOString();
  await db
    .update(wordpressSiteConnections)
    .set({
      lastCheckedAt: now,
      lastError: params.lastError ?? null,
      lastStatus: params.lastStatus,
      updatedAt: now,
    })
    .where(eq(wordpressSiteConnections.projectId, params.projectId));

  return getByProject(params.projectId);
}

export const WordPressConnectionRepository = {
  getByProject,
  updateStatus,
  upsert,
} as const;
