import type { ContentCalendarItem } from "./contentManagerStorage";
import { markdownishToHtml } from "./WordPressPublishSection";

export type ClassicEditorContentDraft = {
  id: string;
  title: string;
  content: string;
  focusKeyphrase?: string;
  metaDescription?: string;
  seoTitle?: string;
};

export type WordPressClassicPostDraft = {
  identity: {
    localDraftId: string;
    calendarItemId?: string;
    contentDraftId?: string;
    externalId: string;
  };
  editor: {
    title: string;
    slug: string;
    contentHtml: string;
    excerpt: string;
  };
  publish: {
    postType: "post" | "page";
    status: "draft" | "pending";
    scheduledAt?: string;
  };
  taxonomy: {
    categories: string[];
    tags: string[];
  };
  yoast: {
    focusKeyphrase: string;
    seoTitle: string;
    metaDescription: string;
    canonical: string;
    robots: string;
  };
  sync: {
    wpPostId?: number;
    editUrl?: string;
    lastSyncedAt?: string;
    lastSyncStatus: "idle" | "syncing" | "synced" | "error";
    lastSyncError?: string;
  };
};

export type ClassicEditorPayload = {
  external_id: string;
  post_type: "post" | "page";
  title: string;
  slug: string;
  content_html: string;
  excerpt: string;
  status: "draft" | "pending";
  scheduled_at: string;
  categories: string[];
  tags: string[];
  yoast: {
    focus_keyphrase: string;
    seo_title: string;
    meta_description: string;
    canonical: string;
    robots: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function getSyncStatus(
  value: unknown,
): WordPressClassicPostDraft["sync"]["lastSyncStatus"] {
  return value === "syncing" || value === "synced" || value === "error"
    ? value
    : "idle";
}

export function normalizeClassicEditorSlug(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\u0590-\u05ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "content-draft";
}

function stableDraftPart(value: string) {
  return normalizeClassicEditorSlug(value).slice(0, 80);
}

function buildContentHtml(contentDraft: ClassicEditorContentDraft | null) {
  if (!contentDraft?.content.trim()) return "";
  return markdownishToHtml(contentDraft.content);
}

export function createClassicEditorDraft({
  calendarItem,
  contentDraft,
}: {
  calendarItem: ContentCalendarItem;
  contentDraft: ClassicEditorContentDraft | null;
}): WordPressClassicPostDraft {
  const calendarPart = stableDraftPart(calendarItem.id);
  const contentPart = contentDraft ? stableDraftPart(contentDraft.id) : "";
  const draftSuffix = [calendarPart, contentPart].filter(Boolean).join("_");
  const title = contentDraft?.title.trim() || calendarItem.title;
  const metaDescription =
    contentDraft?.metaDescription?.trim() ||
    calendarItem.notes.trim().slice(0, 155);

  return {
    editor: {
      contentHtml:
        buildContentHtml(contentDraft) ||
        `<h1>${escapeTextForHtml(calendarItem.title)}</h1>\n<p></p>`,
      excerpt: calendarItem.notes,
      slug: normalizeClassicEditorSlug(title),
      title,
    },
    identity: {
      calendarItemId: calendarItem.id,
      contentDraftId: contentDraft?.id,
      externalId: `openseo_${draftSuffix}`,
      localDraftId: `classic_${draftSuffix}`,
    },
    publish: {
      postType: "post",
      status: "draft",
    },
    sync: {
      lastSyncStatus: "idle",
    },
    taxonomy: {
      categories: ["SEO"],
      tags: calendarItem.secondaryKeywords,
    },
    yoast: {
      canonical: "",
      focusKeyphrase:
        contentDraft?.focusKeyphrase?.trim() || calendarItem.primaryKeyword,
      metaDescription,
      robots: "",
      seoTitle: contentDraft?.seoTitle?.trim() || title,
    },
  };
}

function escapeTextForHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildClassicEditorPayload(
  draft: WordPressClassicPostDraft,
): ClassicEditorPayload {
  return {
    categories: draft.taxonomy.categories,
    content_html: draft.editor.contentHtml.trim(),
    excerpt: draft.editor.excerpt.trim(),
    external_id: draft.identity.externalId,
    post_type: draft.publish.postType,
    scheduled_at: draft.publish.scheduledAt ?? "",
    slug: normalizeClassicEditorSlug(draft.editor.slug || draft.editor.title),
    status: draft.publish.status,
    tags: draft.taxonomy.tags,
    title: draft.editor.title.trim(),
    yoast: {
      canonical: draft.yoast.canonical.trim(),
      focus_keyphrase: draft.yoast.focusKeyphrase.trim(),
      meta_description: draft.yoast.metaDescription.trim(),
      robots: draft.yoast.robots.trim(),
      seo_title: draft.yoast.seoTitle.trim(),
    },
  };
}

function parseClassicEditorDraft(
  value: unknown,
): WordPressClassicPostDraft | null {
  if (!isRecord(value)) return null;
  const identity = isRecord(value.identity) ? value.identity : null;
  const editor = isRecord(value.editor) ? value.editor : null;
  const publish = isRecord(value.publish) ? value.publish : null;
  const taxonomy = isRecord(value.taxonomy) ? value.taxonomy : null;
  const yoast = isRecord(value.yoast) ? value.yoast : null;
  const sync = isRecord(value.sync) ? value.sync : {};

  if (!identity || !editor || !publish || !taxonomy || !yoast) return null;

  const localDraftId = getString(identity.localDraftId);
  const externalId = getString(identity.externalId);
  const title = getString(editor.title);
  const contentHtml = getString(editor.contentHtml);
  const postType = getString(publish.postType);
  const status = getString(publish.status);

  if (
    !localDraftId ||
    !externalId ||
    !title ||
    (postType !== "post" && postType !== "page") ||
    (status !== "draft" && status !== "pending")
  ) {
    return null;
  }

  return {
    editor: {
      contentHtml,
      excerpt: getString(editor.excerpt),
      slug: normalizeClassicEditorSlug(getString(editor.slug) || title),
      title,
    },
    identity: {
      calendarItemId: getString(identity.calendarItemId) || undefined,
      contentDraftId: getString(identity.contentDraftId) || undefined,
      externalId,
      localDraftId,
    },
    publish: {
      postType,
      scheduledAt: getString(publish.scheduledAt) || undefined,
      status,
    },
    sync: {
      editUrl: getString(sync.editUrl) || undefined,
      lastSyncError: getString(sync.lastSyncError) || undefined,
      lastSyncStatus: getSyncStatus(sync.lastSyncStatus),
      lastSyncedAt: getString(sync.lastSyncedAt) || undefined,
      wpPostId: typeof sync.wpPostId === "number" ? sync.wpPostId : undefined,
    },
    taxonomy: {
      categories: getStringList(taxonomy.categories),
      tags: getStringList(taxonomy.tags),
    },
    yoast: {
      canonical: getString(yoast.canonical),
      focusKeyphrase: getString(yoast.focusKeyphrase),
      metaDescription: getString(yoast.metaDescription),
      robots: getString(yoast.robots),
      seoTitle: getString(yoast.seoTitle),
    },
  };
}

export function parseStoredClassicEditorDrafts(value: string | null) {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const draft = parseClassicEditorDraft(item);
      return draft ? [draft] : [];
    });
  } catch {
    return [];
  }
}

export function upsertClassicEditorDraft(
  current: readonly WordPressClassicPostDraft[],
  draft: WordPressClassicPostDraft,
) {
  const next = current.filter(
    (item) => item.identity.localDraftId !== draft.identity.localDraftId,
  );
  return [...next, draft];
}

export function findClassicEditorDraft(
  drafts: readonly WordPressClassicPostDraft[],
  calendarItemId: string,
  contentDraftId?: string,
) {
  if (contentDraftId) {
    const exact = drafts.find(
      (draft) =>
        draft.identity.calendarItemId === calendarItemId &&
        draft.identity.contentDraftId === contentDraftId,
    );
    if (exact) return exact;
  }

  return drafts
    .toReversed()
    .find((draft) => draft.identity.calendarItemId === calendarItemId);
}
