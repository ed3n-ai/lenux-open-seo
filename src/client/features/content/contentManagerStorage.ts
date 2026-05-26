export type ContentWorkflowRole = "content-manager" | "seo-operator";

export type ContentGoal = "traffic" | "leads" | "authority" | "product";

export type ContentIdea = {
  id: string;
  title: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  contentType: string;
  intent: string;
  goal: ContentGoal;
  notes: string;
};

export type CalendarStatus =
  | "idea"
  | "planned"
  | "writing"
  | "editing"
  | "ready"
  | "published";

export type ContentCalendarItem = ContentIdea & {
  dueDate: string;
  status: CalendarStatus;
};

export type ContentDirectionInput = {
  domain: string;
  audience: string;
  language: string;
  tone: string;
  goal: ContentGoal;
};

export type PublicationPayload = {
  external_id: string;
  post_type: "post" | "page";
  title: string;
  slug: string;
  content_html: string;
  excerpt: string;
  status: "draft" | "pending";
  categories: string[];
  tags: string[];
  seo: {
    meta_title: string;
    meta_description: string;
    focus_keyword: string;
    canonical: string;
    robots: string;
  };
};

export const roleLabels: Record<ContentWorkflowRole, string> = {
  "content-manager": "מנהל תוכן",
  "seo-operator": "איש SEO",
};

export const workflowRoleChangedEvent = "openseo:workflow-role-changed";

export const goalLabels: Record<ContentGoal, string> = {
  authority: "סמכות מקצועית",
  leads: "לידים",
  product: "תמיכה במוצר",
  traffic: "תנועה אורגנית",
};

export const calendarStatusLabels: Record<CalendarStatus, string> = {
  editing: "מוכן לעריכה",
  idea: "רעיון",
  planned: "מתוכנן",
  published: "פורסם",
  ready: "מוכן לפרסום",
  writing: "בכתיבה",
};

const goalValues: readonly ContentGoal[] = [
  "traffic",
  "leads",
  "authority",
  "product",
];
const calendarStatusValues: readonly CalendarStatus[] = [
  "idea",
  "planned",
  "writing",
  "editing",
  "ready",
  "published",
];

export function isContentGoal(value: string): value is ContentGoal {
  return goalValues.some((item) => item === value);
}

export function isCalendarStatus(value: string): value is CalendarStatus {
  return calendarStatusValues.some((item) => item === value);
}

export function isPostType(value: string): value is "post" | "page" {
  return value === "post" || value === "page";
}

export function isPublishStatus(value: string): value is "draft" | "pending" {
  return value === "draft" || value === "pending";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function getStringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseContentIdea(value: unknown): ContentIdea | null {
  if (!isRecord(value)) return null;
  const goal = getString(value.goal);
  if (!isContentGoal(goal)) return null;

  const id = getString(value.id);
  const title = getString(value.title);
  const primaryKeyword = getString(value.primaryKeyword);
  if (!id || !title || !primaryKeyword) return null;

  return {
    contentType: getString(value.contentType),
    goal,
    id,
    intent: getString(value.intent),
    notes: getString(value.notes),
    primaryKeyword,
    secondaryKeywords: getStringList(value.secondaryKeywords),
    title,
  };
}

export function parseStoredContentIdeas(value: string | null) {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isUnknownArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const idea = parseContentIdea(item);
      return idea ? [idea] : [];
    });
  } catch {
    return [];
  }
}

export function parseStoredCalendarItems(value: string | null) {
  return parseStoredContentIdeas(value).flatMap((idea) => {
    if (!value) return [];

    try {
      const parsed: unknown = JSON.parse(value);
      if (!isUnknownArray(parsed)) return [];
      const raw = parsed.find(
        (item) => isRecord(item) && getString(item.id) === idea.id,
      );
      if (!isRecord(raw)) return [];
      const status = getString(raw.status);
      const dueDate = getString(raw.dueDate);
      if (!isCalendarStatus(status) || !dueDate) return [];
      return [{ ...idea, dueDate, status }];
    } catch {
      return [];
    }
  });
}

function slugify(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9\u0590-\u05ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "content-draft";
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stableId(...parts: string[]) {
  return slugify(parts.filter(Boolean).join("-")).slice(0, 80);
}

export function getProjectUserStorageKey(
  projectId: string,
  userKey: string,
  suffix: string,
) {
  return `openseo:${projectId}:${userKey}:${suffix}`;
}

export function parseStoredRole(value: string | null) {
  if (!value) return null;
  if (value === "content-manager" || value === "seo-operator") return value;
  return null;
}

export function getStoredWorkflowRole(projectId: string, userKey: string) {
  const key = getProjectUserStorageKey(projectId, userKey, "workflow-role");
  return parseStoredRole(window.localStorage.getItem(key));
}

export function storeWorkflowRole(
  projectId: string,
  userKey: string,
  role: ContentWorkflowRole,
) {
  const key = getProjectUserStorageKey(projectId, userKey, "workflow-role");
  window.localStorage.setItem(key, role);
  window.dispatchEvent(
    new CustomEvent(workflowRoleChangedEvent, {
      detail: { projectId, role, userKey },
    }),
  );
}

export function createContentIdeas(input: ContentDirectionInput) {
  const domain = input.domain.trim() || "התחום המרכזי";
  const audience = input.audience.trim() || "קהל היעד";
  const tone = input.tone.trim() || "ברור ומעשי";
  const language = input.language.trim() || "עברית";
  const goal = goalLabels[input.goal];

  return [
    {
      id: stableId(domain, audience, input.goal, "guide"),
      title: `מדריך מעשי ל${domain} עבור ${audience}`,
      primaryKeyword: domain,
      secondaryKeywords: [audience, goal, language],
      contentType: "מדריך",
      intent: "למידה והשוואה",
      goal: input.goal,
      notes: `לכתוב בטון ${tone}, עם דוגמאות וצעדי המשך ברורים.`,
    },
    {
      id: stableId(domain, audience, input.goal, "checklist"),
      title: `צ'קליסט ${domain}: מה לבדוק לפני שמתחילים`,
      primaryKeyword: `${domain} צ'קליסט`,
      secondaryKeywords: [domain, "תכנון", "טעויות נפוצות"],
      contentType: "צ'קליסט",
      intent: "פתרון בעיה",
      goal: input.goal,
      notes: "מתאים לתוכן קצר, סריק ובר ביצוע.",
    },
    {
      id: stableId(domain, audience, input.goal, "comparison"),
      title: `איך לבחור פתרון ${domain} בלי לבזבז זמן`,
      primaryKeyword: `בחירת ${domain}`,
      secondaryKeywords: [audience, "קריטריונים", "השוואה"],
      contentType: "השוואה",
      intent: "כוונת קנייה או החלטה",
      goal: input.goal,
      notes: "להציג קריטריונים, tradeoffs, ותסריטי שימוש.",
    },
    {
      id: stableId(domain, audience, input.goal, "mistakes"),
      title: `טעויות נפוצות ב${domain} ואיך להימנע מהן`,
      primaryKeyword: `טעויות ב${domain}`,
      secondaryKeywords: [domain, audience, "מניעה"],
      contentType: "טעויות נפוצות",
      intent: "פתרון בעיה",
      goal: input.goal,
      notes: `לכתוב בטון ${tone}, עם דוגמאות קצרות ותיקון מעשי לכל טעות.`,
    },
    {
      id: stableId(domain, audience, input.goal, "faq"),
      title: `שאלות ותשובות על ${domain} עבור ${audience}`,
      primaryKeyword: `שאלות על ${domain}`,
      secondaryKeywords: [domain, audience, "FAQ"],
      contentType: "שאלות ותשובות",
      intent: "למידה מהירה",
      goal: input.goal,
      notes: "לבנות סביב שאלות אמיתיות, תשובות קצרות, וקישורים פנימיים עתידיים.",
    },
    {
      id: stableId(domain, audience, input.goal, "process"),
      title: `תהליך עבודה מומלץ ל${domain}: משלב התכנון עד הביצוע`,
      primaryKeyword: `תהליך ${domain}`,
      secondaryKeywords: [domain, "שלבים", "יישום"],
      contentType: "תהליך עבודה",
      intent: "ביצוע מעשי",
      goal: input.goal,
      notes: "לחלק לשלבים ברורים, אחריות, תוצרים, ונקודות בדיקה.",
    },
    {
      id: stableId(domain, audience, input.goal, "metrics"),
      title: `איך למדוד הצלחה ב${domain}: מדדים שחשוב לעקוב אחריהם`,
      primaryKeyword: `מדדי ${domain}`,
      secondaryKeywords: [domain, "מדידה", goal],
      contentType: "מדדים",
      intent: "הערכה ושיפור",
      goal: input.goal,
      notes: "לכלול טבלת KPI, פירוש המדדים, ומה עושים כשהמספרים חלשים.",
    },
    {
      id: stableId(domain, audience, input.goal, "case-study"),
      title: `מקרה לדוגמה: איך ${audience} יכולים לשפר ${domain}`,
      primaryKeyword: `דוגמה ל${domain}`,
      secondaryKeywords: [audience, domain, "מקרה בוחן"],
      contentType: "מקרה בוחן",
      intent: "המחשה ושכנוע",
      goal: input.goal,
      notes: "לבנות סיפור לפני-אחרי, בעיה, פעולה, תוצאה, ותובנה מעשית.",
    },
    {
      id: stableId(domain, audience, input.goal, "tools"),
      title: `כלים ושיטות עבודה מומלצים ל${domain}`,
      primaryKeyword: `כלים ל${domain}`,
      secondaryKeywords: [domain, "כלים", "שיטות עבודה"],
      contentType: "כלים",
      intent: "בחירת פתרון",
      goal: input.goal,
      notes: "להציג יתרונות, חסרונות, מתי להשתמש בכל כלי, ומה לאוטומט.",
    },
  ] satisfies ContentIdea[];
}

export function addUniqueIdeas<T extends { id: string }>(
  current: readonly T[],
  next: readonly T[],
) {
  const existing = new Set(current.map((item) => item.id));
  return [...current, ...next.filter((item) => !existing.has(item.id))];
}

export function createCalendarItem(
  idea: ContentIdea,
  dueDate: string,
): ContentCalendarItem {
  return {
    ...idea,
    dueDate,
    status: "planned",
  };
}

export function createCalendarItemFromDraft(input: {
  focusKeyphrase?: string;
  id: string;
  title: string;
}): ContentCalendarItem {
  const title = input.title.trim() || "טיוטת תוכן";
  const primaryKeyword = input.focusKeyphrase?.trim() || title;

  return {
    contentType: "טיוטת AI",
    dueDate: new Date().toISOString().slice(0, 10),
    goal: "authority",
    id: `standalone-${input.id}`,
    intent: "עריכה ופרסום",
    notes: "נוצר אוטומטית כדי לפתוח טיוטת AI קיימת בעורך הפרסום.",
    primaryKeyword,
    secondaryKeywords: [],
    status: "editing",
    title,
  };
}

export function buildPublicationPayload(input: {
  title: string;
  slug: string;
  contentHtml: string;
  excerpt: string;
  postType: "post" | "page";
  status: "draft" | "pending";
  categories: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonical: string;
  robots: string;
}): PublicationPayload {
  const title = input.title.trim();
  const slug = slugify(input.slug || title);

  return {
    external_id: `openseo_${slug}`,
    post_type: input.postType,
    title,
    slug,
    content_html: input.contentHtml.trim(),
    excerpt: input.excerpt.trim(),
    status: input.status,
    categories: splitList(input.categories),
    tags: splitList(input.tags),
    seo: {
      canonical: input.canonical.trim(),
      focus_keyword: input.focusKeyword.trim(),
      meta_description: input.metaDescription.trim(),
      meta_title: input.metaTitle.trim(),
      robots: input.robots.trim(),
    },
  };
}
