import { CONTENT_MONTHLY_WORD_LIMIT } from "@/types/schemas/content";
import type { GenerateContentDraftInput } from "@/types/schemas/content";
import type { EnsuredUserContext } from "@/middleware/ensure-user/types";
import { AppError } from "@/server/lib/errors";
import { ContentRepository } from "@/server/features/content/repositories/ContentRepository";

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

function getToneDirection(tone: GenerateContentDraftInput["tone"]) {
  return {
    clear: {
      en: "The tone is direct, practical, and easy to scan.",
      he: "הטון צריך להיות ברור, מעשי וקל לסריקה.",
    },
    expert: {
      en: "The tone is authoritative, with specific reasoning and confident recommendations.",
      he: "הטון צריך להיות מקצועי וסמכותי, עם נימוקים ברורים והמלצות בטוחות.",
    },
    friendly: {
      en: "The tone is approachable, encouraging, and simple without becoming shallow.",
      he: "הטון צריך להיות נגיש, ידידותי ופשוט בלי להישמע שטחי.",
    },
    persuasive: {
      en: "The tone focuses on outcomes, objections, and a clear reason to act.",
      he: "הטון צריך להתמקד בתוצאה, בהתנגדויות ובסיבה ברורה לפעולה.",
    },
  }[tone];
}

function getPrimaryKeyword(input: GenerateContentDraftInput) {
  return input.keywords[0] ?? input.topic;
}

function buildKeywordGuidance(
  keywords: string[],
  language: GenerateContentDraftInput["language"],
) {
  if (keywords.length === 0) {
    return language === "he"
      ? "שלבו את הנושא המרכזי באופן טבעי בכותרת, בפתיחה, באחת מכותרות המשנה ובסיכום. מונחים קשורים אפשר להוסיף בעריכה."
      : "Use the main topic naturally in the title, introduction, one H2, and the conclusion. Add related terms during editorial review.";
  }

  const [primary, ...secondary] = keywords;
  if (secondary.length === 0) {
    return language === "he"
      ? `מילת מפתח ראשית: ${primary}. שלבו אותה בכותרת, בפתיחה, באחת מכותרות המשנה ובסיכום בלי לדחוס אותה בכוח.`
      : `Primary keyword: ${primary}. Use it in the title, introduction, one H2, and conclusion without forcing repetition.`;
  }

  return language === "he"
    ? `מילת מפתח ראשית: ${primary}. מונחים משניים: ${secondary.join(", ")}. השתמשו בהם כהקשר לסעיפים, לא כרשימת חזרה מכנית.`
    : `Primary keyword: ${primary}. Secondary terms: ${secondary.join(", ")}. Use them as section-level context, not as a repeated checklist.`;
}

function buildReaderPromise(input: GenerateContentDraftInput) {
  if (input.language === "he") {
    return `בסוף הקריאה, הקוראים צריכים להבין מה המשמעות של ${input.topic}, למה זה חשוב, איך להעריך אפשרויות ומה כדאי לעשות בהמשך.`;
  }

  return `By the end, readers should understand what ${input.topic} means, why it matters, how to evaluate options, and what to do next.`;
}

function buildFaq(input: GenerateContentDraftInput) {
  const primaryKeyword = getPrimaryKeyword(input);

  if (input.language === "he") {
    return [
      `## שאלות נפוצות`,
      `### מה הדבר החשוב ביותר לדעת על ${primaryKeyword}?`,
      `הדבר החשוב ביותר הוא לחבר את הנושא להחלטה אמיתית. מאמר טוב לא רק מגדיר את ${primaryKeyword}; הוא עוזר לקורא להבין את השיקולים, להימנע מטעויות נפוצות ולבחור צעד המשך מעשי.`,
      `### איך כדאי להתחיל?`,
      `כדאי להתחיל ממקרה שימוש אחד וממוקד. מגדירים את המצב הנוכחי, את התוצאה הרצויה ואת הקריטריונים להצלחה. כך המאמר נשאר קונקרטי ולא הופך לעצה כללית שקשה ליישם.`,
    ];
  }

  return [
    `## FAQ`,
    `### What is the most important thing to know about ${primaryKeyword}?`,
    `The most important thing is to connect the topic to a real decision. A good article should not only define ${primaryKeyword}; it should help the reader understand the tradeoffs, avoid common mistakes, and choose a practical next step.`,
    `### How should readers get started?`,
    `Start with one focused use case. Gather the current baseline, define the outcome you want, and document what would make the effort successful. This keeps the work concrete and prevents the article from turning into broad advice that is hard to apply.`,
  ];
}

function buildBodySections(input: GenerateContentDraftInput) {
  const primaryKeyword = getPrimaryKeyword(input);
  const keywordGuidance = buildKeywordGuidance(input.keywords, input.language);
  const readerPromise = buildReaderPromise(input);

  if (input.language === "he") {
    return [
      `## למה ${primaryKeyword} חשוב`,
      `${input.topic} חשוב כי קוראים מגיעים בדרך כלל עם בעיה או החלטה, לא מתוך סקרנות כללית. הם יכולים להשוות בין פתרונות, להצדיק תקציב או לחפש תהליך עבודה אמין. ${readerPromise}`,
      `מאמר חזק צריך להפוך את ההחלטה לפשוטה יותר. לכן חשוב להסביר את ההקשר, להציג את הקריטריונים שבאמת משפיעים על הבחירה, ולסיים עם פעולה ברורה. הימנעו מהצהרות כלליות שחוזרות על עצמן. כל סעיף צריך להפחית אי ודאות.`,
      `## מה כדאי לדעת לפני שמתחילים`,
      `לפני שממליצים על פעולה, כדאי להגדיר את המצב הנוכחי: מה עובד היום, מה לא עומד בציפיות, ומה המגבלה המרכזית - זמן, תקציב, מורכבות טכנית או ביטחון בנתונים. השאלות האלה הופכות את ההמלצה לספציפית ורלוונטית.`,
      keywordGuidance,
      `## מסגרת עבודה מעשית`,
      `מסגרת פשוטה יכולה להספיק: מאבחנים את הבעיה, בוחרים את ההזדמנות עם ההשפעה הגבוהה ביותר, מבצעים שיפור ממוקד אחד ואז מודדים את התוצאה. כך שומרים על תהליך שניתן לנהל ולשפר.`,
      `המסגרת הטובה ביותר היא זו שיוצרת התקדמות מהר. התחילו מנקודת הכאב הברורה ביותר, בחרו מדד הצלחה אחד, ואל תרחיבו את היקף העבודה לפני שיש תוצאה ראשונה שאפשר ללמוד ממנה.`,
      `## טעויות נפוצות שכדאי להימנע מהן`,
      `הטעות הראשונה היא לכתוב לכולם. מאמר שימושי צריך להגדיר מי הקורא, מה הסיטואציה שלו ואיזו החלטה הוא מנסה לקבל. הטעות השנייה היא להחליף דוגמאות וטיעונים במילות באזז. הטעות השלישית היא לסיים בלי צעד המשך ברור.`,
      `בעיה נוספת היא להתייחס למילות מפתח כאל המטרה עצמה. מילות מפתח עוזרות לחשיפה, אבל התוכן עדיין צריך לבנות אמון. השתמשו בכוונת החיפוש כדי לעצב את המאמר, ובדוגמאות, השוואות והכוונה מעשית כדי להצדיק את הקריאה.`,
      `## הצעד הבא המומלץ`,
      `כדי להפוך את הטיוטה לעמוד שמוכן לפרסום, הוסיפו דוגמאות מוצר, קישורים פנימיים, צילומי מסך, ניסוחים של לקוחות או נתונים מתוך העבודה שלכם. לאחר מכן בדקו יחד את הפתיחה והסיכום: שניהם צריכים להבטיח את אותו ערך ולהוביל לאותה פעולה.`,
    ];
  }

  return [
    `## Why ${primaryKeyword} matters`,
    `${input.topic} matters because readers usually arrive with a specific problem, not casual curiosity. They may be comparing approaches, trying to justify a budget, or looking for a reliable process. ${readerPromise}`,
    `A strong article should make the decision feel easier. That means explaining the context, showing the criteria that matter, and making the next action obvious. Avoid repeating high-level claims. Each section should reduce uncertainty for the reader.`,
    `## What to know before you start`,
    `Before taking action, define the current state. What is working now? What is underperforming? Which constraint matters most: time, budget, technical complexity, or confidence in the data? These questions help shape a useful recommendation instead of a generic overview.`,
    keywordGuidance,
    `## A practical framework`,
    `Use a simple framework: diagnose the problem, prioritize the highest-impact opportunity, execute one focused improvement, then measure the result. This keeps the work manageable and gives the reader a way to judge progress.`,
    `The best framework is usually the one that creates momentum quickly. Start with the clearest pain point, choose one measurable outcome, and avoid expanding the scope until the first result is visible.`,
    `## Common mistakes to avoid`,
    `The first mistake is writing for everyone. A useful article should name the reader, their situation, and the decision they are trying to make. The second mistake is relying on buzzwords instead of evidence. The third mistake is ending without a concrete next step.`,
    `Another common issue is treating keywords as the goal. Keywords help with discoverability, but the content still has to earn trust. Use search intent to shape the article, then use examples, comparisons, and practical guidance to make it worth reading.`,
    `## Recommended next step`,
    `Turn this topic into a publishable page by adding product examples, internal links, screenshots, customer language, or data points from your own workflow. Then review the introduction and conclusion together: they should make the same promise and point to the same action.`,
  ];
}

function buildDraft(input: GenerateContentDraftInput) {
  const title = toTitle(input.topic);
  const toneDirection = getToneDirection(input.tone);

  if (input.language === "he") {
    const sections = [
      `# ${title}`,
      `המאמר מסביר את ${input.topic} עם נקודת מבט ברורה, מבנה מעשי ומספיק עומק כדי שעורך יוכל להפוך אותו למאמר SEO מוכן לפרסום. ${toneDirection.he}`,
      ...buildBodySections(input),
      ...buildFaq(input),
      `## סיכום`,
      `${input.topic} יוצר ערך כאשר הוא עוזר לקורא לקבל החלטה טובה יותר. שמרו על מיקוד בסיטואציה של הקורא, הסבירו את השיקולים בצורה פשוטה, וסיימו בצעד המשך מספיק ספציפי כדי לפעול לפיו.`,
    ];

    return trimToWordLimit(sections.join("\n\n"), input.targetWords);
  }

  const sections = [
    `# ${title}`,
    `This article explains ${input.topic} with a clear point of view, practical structure, and enough detail for an editor to turn it into a publishable SEO article. ${toneDirection.en}`,
    ...buildBodySections(input),
    ...buildFaq(input),
    `## Conclusion`,
    `${input.topic} is most valuable when it helps the reader make a better decision. Keep the article focused on the reader's situation, explain the tradeoffs plainly, and end with a next step that is specific enough to act on.`,
  ];

  return trimToWordLimit(sections.join("\n\n"), input.targetWords);
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

  const content = buildDraft(input);
  const wordCount = countWords(content);
  if (wordCount > usage.remaining) {
    throw new AppError("CONTENT_WORD_LIMIT_REACHED");
  }

  const id = crypto.randomUUID();
  const title = toTitle(input.topic);
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
    wordCount: row.wordCount,
    createdAt: row.createdAt,
  };
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
  generateDraft,
  getDraft,
  getUsageSummary,
  listRecentDrafts,
} as const;
