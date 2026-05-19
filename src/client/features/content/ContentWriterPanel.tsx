import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Clipboard, FileText, Sparkles } from "lucide-react";
import {
  generateContentDraft,
  getContentDraft,
  getContentWriterStatus,
} from "@/serverFunctions/content";
import { CONTENT_MONTHLY_WORD_LIMIT } from "@/types/schemas/content";
import { getStandardErrorMessage } from "@/client/lib/error-messages";

export type ContentWriterDraftResult = {
  id: string;
  title: string;
  content: string;
  focusKeyphrase?: string;
  metaDescription?: string;
  seoTitle?: string;
  wordCount: number;
  createdAt?: string;
};

type ContentLanguage = "he" | "en";
type ContentTone = "clear" | "expert" | "friendly" | "persuasive";

type DraftPrefill = {
  topic: string;
  keywords?: string[];
};

function isContentLanguage(value: string): value is ContentLanguage {
  return value === "he" || value === "en";
}

function isContentTone(value: string): value is ContentTone {
  return (
    value === "clear" ||
    value === "expert" ||
    value === "friendly" ||
    value === "persuasive"
  );
}

function parseKeywords(value: string) {
  return value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function getDraftDirection(content: string) {
  return /[\u0590-\u05ff]/.test(content) ? "rtl" : "ltr";
}

export function ContentWriterPanel({
  projectId,
  draftPrefill,
  openedPublishingDraftId,
  onOpenPublishingEditor,
  onRecentDraftLoaded,
}: {
  projectId: string;
  draftPrefill?: DraftPrefill | null;
  openedPublishingDraftId?: string | null;
  onOpenPublishingEditor?: (draft: ContentWriterDraftResult) => void;
  onRecentDraftLoaded?: (draft: ContentWriterDraftResult) => void;
}) {
  const [topic, setTopic] = React.useState("");
  const [language, setLanguage] = React.useState<ContentLanguage>("he");
  const [tone, setTone] = React.useState<ContentTone>("clear");
  const [keywords, setKeywords] = React.useState("");
  const [targetWords, setTargetWords] = React.useState(1000);
  const [draft, setDraft] = React.useState<ContentWriterDraftResult | null>(
    null,
  );
  const [copyState, setCopyState] = React.useState<"idle" | "copied">("idle");
  const lastPrefillTopic = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!draftPrefill || draftPrefill.topic === lastPrefillTopic.current) {
      return;
    }

    lastPrefillTopic.current = draftPrefill.topic;
    setTopic(draftPrefill.topic);
    setKeywords(draftPrefill.keywords?.join(", ") ?? "");
    setDraft(null);
  }, [draftPrefill]);

  const statusQuery = useQuery({
    queryKey: ["content-writer-status", projectId],
    queryFn: () => getContentWriterStatus({ data: { projectId } }),
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      generateContentDraft({
        data: {
          projectId,
          topic,
          language,
          tone,
          keywords: parseKeywords(keywords),
          targetWords,
        },
      }),
    onSuccess: (result) => {
      setDraft(result.draft);
      void statusQuery.refetch();
    },
  });

  const loadDraftMutation = useMutation({
    mutationFn: (draftId: string) =>
      getContentDraft({ data: { projectId, draftId } }),
    onSuccess: (result) => {
      setDraft(result);
      onRecentDraftLoaded?.(result);
      setCopyState("idle");
    },
  });

  async function copyDraft() {
    if (!draft?.content) return;
    try {
      await navigator.clipboard.writeText(draft.content);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("idle");
    }
  }

  const usage = statusQuery.data?.usage ?? {
    limit: CONTENT_MONTHLY_WORD_LIMIT,
    monthKey: "",
    remaining: CONTENT_MONTHLY_WORD_LIMIT,
    wordsUsed: 0,
  };
  const usedPercent = Math.min(100, (usage.wordsUsed / usage.limit) * 100);
  const canGenerate =
    topic.trim().length >= 3 &&
    targetWords <= usage.remaining &&
    !generateMutation.isPending;
  const isDraftOpenInEditor =
    Boolean(draft?.id) && draft?.id === openedPublishingDraftId;

  return (
    <section className="rounded-lg border border-base-300 bg-base-100 p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">מנוע כתיבת תוכן</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/70">
            יצירת טיוטות SEO מובנות עם מגבלה חודשית קשיחה של{" "}
            {CONTENT_MONTHLY_WORD_LIMIT.toLocaleString()} מילים לכל סביבת עבודה.
          </p>
        </div>

        <div className="min-w-52 rounded-lg border border-base-300 bg-base-200 p-3">
          <div className="flex justify-between text-xs text-base-content/60">
            <span>{usage.monthKey || "החודש"}</span>
            <span>
              {usage.wordsUsed.toLocaleString()} /{" "}
              {usage.limit.toLocaleString()}
            </span>
          </div>
          <progress
            className="progress progress-primary mt-2 w-full"
            value={usedPercent}
            max={100}
          />
          <p className="mt-2 text-xs text-base-content/60">
            נותרו {usage.remaining.toLocaleString()} מילים
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canGenerate) generateMutation.mutate();
          }}
        >
          <label className="form-control">
            <span className="label pb-1 text-xs font-medium text-base-content/60">
              נושא
            </span>
            <input
              className="input input-bordered w-full"
              value={topic}
              placeholder="לדוגמה: בדיקת SEO טכנית לאתרי SaaS"
              onChange={(event) => setTopic(event.target.value)}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="form-control">
              <span className="label pb-1 text-xs font-medium text-base-content/60">
                שפה
              </span>
              <select
                className="select select-bordered w-full"
                value={language}
                onChange={(event) => {
                  if (isContentLanguage(event.target.value)) {
                    setLanguage(event.target.value);
                  }
                }}
              >
                <option value="he">עברית</option>
                <option value="en">English</option>
              </select>
            </label>

            <label className="form-control">
              <span className="label pb-1 text-xs font-medium text-base-content/60">
                טון
              </span>
              <select
                className="select select-bordered w-full"
                value={tone}
                onChange={(event) => {
                  if (isContentTone(event.target.value)) {
                    setTone(event.target.value);
                  }
                }}
              >
                <option value="clear">ברור</option>
                <option value="expert">מקצועי</option>
                <option value="friendly">ידידותי</option>
                <option value="persuasive">שיווקי</option>
              </select>
            </label>

            <label className="form-control">
              <span className="label pb-1 text-xs font-medium text-base-content/60">
                יעד מילים
              </span>
              <input
                type="number"
                min={150}
                max={2500}
                className="input input-bordered w-full"
                value={targetWords}
                onChange={(event) => setTargetWords(Number(event.target.value))}
              />
            </label>
          </div>

          <label className="form-control">
            <span className="label pb-1 text-xs font-medium text-base-content/60">
              מילות מפתח
            </span>
            <input
              className="input input-bordered w-full"
              value={keywords}
              placeholder="מחקר מילות מפתח, תוכן SEO, מעקב דירוגים"
              onChange={(event) => setKeywords(event.target.value)}
            />
          </label>

          {generateMutation.isError ? (
            <div className="alert alert-error">
              <span className="text-sm">
                {getStandardErrorMessage(generateMutation.error)}
              </span>
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary w-full gap-2"
            disabled={!canGenerate}
          >
            {generateMutation.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Sparkles className="size-4" />
            )}
            צור טיוטה
          </button>
        </form>

        <div className="min-w-0 rounded-lg border border-base-300 bg-base-200 p-4">
          {draft ? (
            <article>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="font-semibold">{draft.title}</h3>
                  <p className="mt-1 text-xs text-base-content/60">
                    {draft.wordCount} מילים
                    {draft.createdAt ? ` · ${draft.createdAt}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline gap-2 self-start sm:self-auto"
                  onClick={() => void copyDraft()}
                >
                  {copyState === "copied" ? (
                    <Check className="size-4" />
                  ) : (
                    <Clipboard className="size-4" />
                  )}
                  {copyState === "copied" ? "הועתק" : "העתק"}
                </button>
                {onOpenPublishingEditor ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary gap-2 self-start sm:self-auto"
                    onClick={() => onOpenPublishingEditor(draft)}
                  >
                    <FileText className="size-4" />
                    פתח בעורך פרסום
                  </button>
                ) : null}
              </div>
              {isDraftOpenInEditor ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        הטיוטה פתוחה בעורך הפרסום למטה.
                      </p>
                      <p className="mt-1 text-xs text-base-content/60">
                        כדי למנוע כפילות, גוף המאמר מוצג כעת רק בעורך שבו מבצעים
                        עריכה, Yoast ופרסום.
                      </p>
                    </div>
                    <a
                      className="btn btn-sm btn-outline"
                      href="#publishing-editor"
                    >
                      עבור לעורך
                    </a>
                  </div>
                </div>
              ) : (
                <pre
                  className="whitespace-pre-wrap rounded-lg bg-base-100 p-4 text-sm leading-6 text-base-content/80"
                  dir={getDraftDirection(draft.content)}
                >
                  {draft.content}
                </pre>
              )}
            </article>
          ) : (
            <div className="flex min-h-80 flex-col items-center justify-center text-center">
              <FileText className="size-10 text-base-content/30" />
              <p className="mt-3 text-sm text-base-content/60">
                הטיוטה שתיווצר תופיע כאן.
              </p>
            </div>
          )}
        </div>
      </div>

      {statusQuery.data?.drafts.length ? (
        <div className="mt-5 border-t border-base-300 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">טיוטות אחרונות</h3>
            {loadDraftMutation.isError ? (
              <span className="text-xs text-error">
                {getStandardErrorMessage(loadDraftMutation.error)}
              </span>
            ) : null}
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {statusQuery.data.drafts.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rounded-lg border border-base-300 bg-base-200 p-3 text-start transition-colors hover:border-primary/60 disabled:cursor-wait disabled:opacity-70"
                disabled={loadDraftMutation.isPending}
                onClick={() => loadDraftMutation.mutate(item.id)}
              >
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-base-content/60">
                  {item.wordCount} מילים · {item.createdAt}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
