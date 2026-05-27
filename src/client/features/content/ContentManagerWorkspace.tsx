import * as React from "react";
import { BarChart3, CalendarDays, Lightbulb } from "lucide-react";
import { ContentCalendarSection } from "@/client/features/content/ContentCalendarSection";
import { ContentIdeasSection } from "@/client/features/content/ContentIdeasSection";
import {
  addUniqueIdeas,
  createCalendarItem,
  getProjectUserStorageKey,
  parseStoredCalendarItems,
  parseStoredContentIdeas,
  type ContentCalendarItem,
  type ContentIdea,
} from "@/client/features/content/contentManagerStorage";

export type ContentManagerView =
  | "overview"
  | "ideas"
  | "saved-ideas"
  | "weekly-plan"
  | "writer";

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getDefaultDueDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function ContentManagerWorkspace({
  projectId,
  userKey,
  onDraftRequest,
  view = "overview",
}: {
  projectId: string;
  userKey: string;
  onDraftRequest: (idea: ContentIdea) => void;
  view?: ContentManagerView;
}) {
  const ideasKey = getProjectUserStorageKey(
    projectId,
    userKey,
    "content-ideas",
  );
  const calendarKey = getProjectUserStorageKey(
    projectId,
    userKey,
    "content-calendar",
  );
  const [savedIdeas, setSavedIdeas] = React.useState<ContentIdea[]>([]);
  const [calendarItems, setCalendarItems] = React.useState<
    ContentCalendarItem[]
  >([]);

  React.useEffect(() => {
    setSavedIdeas(
      parseStoredContentIdeas(window.localStorage.getItem(ideasKey)),
    );
    setCalendarItems(
      parseStoredCalendarItems(window.localStorage.getItem(calendarKey)),
    );
  }, [ideasKey, calendarKey]);

  React.useEffect(() => {
    writeJson(ideasKey, savedIdeas);
  }, [ideasKey, savedIdeas]);

  React.useEffect(() => {
    writeJson(calendarKey, calendarItems);
  }, [calendarKey, calendarItems]);

  function saveIdea(idea: ContentIdea) {
    setSavedIdeas((current) => addUniqueIdeas(current, [idea]));
  }

  function addIdeaToCalendar(idea: ContentIdea) {
    setCalendarItems((current) =>
      addUniqueIdeas(current, [
        createCalendarItem(idea, getDefaultDueDate(current.length + 2)),
      ]),
    );
  }

  function updateCalendarItem(
    id: string,
    patch: Partial<Pick<ContentCalendarItem, "dueDate" | "status">>,
  ) {
    setCalendarItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  if (view === "writer") {
    return null;
  }

  if (view === "saved-ideas") {
    return (
      <SavedIdeasPage
        savedIdeas={savedIdeas}
        onAddToCalendar={addIdeaToCalendar}
      />
    );
  }

  if (view === "weekly-plan") {
    return (
      <WeeklyPlanPage
        items={calendarItems}
        savedIdeas={savedIdeas}
        onAddToCalendar={addIdeaToCalendar}
        onDraftRequest={onDraftRequest}
        onUpdateItem={updateCalendarItem}
      />
    );
  }

  return (
    <div className="space-y-6">
      <CompetitorWordCountSection />
      <ContentIdeasSection
        onAddToCalendar={addIdeaToCalendar}
        onSaveIdea={saveIdea}
      />
      <ContentCalendarSection
        items={calendarItems}
        savedIdeas={savedIdeas}
        onAddToCalendar={addIdeaToCalendar}
        onDraftRequest={onDraftRequest}
        onUpdateItem={updateCalendarItem}
      />
    </div>
  );
}

function CompetitorWordCountSection() {
  const [counts, setCounts] = React.useState("900, 1200, 1500");
  const numbers = counts
    .split(/[,\n]/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
  const average = numbers.length
    ? Math.round(numbers.reduce((sum, item) => sum + item, 0) / numbers.length)
    : 0;
  const recommended = average ? Math.round(average * 1.1) : 0;

  return (
    <section className="rounded-lg border border-base-300 bg-base-100 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">כמות מילים לפי מתחרים</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-base-content/70">
            הזינו ספירת מילים של עמודים מתחרים כדי לקבוע יעד טיוטה ריאלי.
          </p>
        </div>
        <label className="form-control w-full md:max-w-md">
          <span className="label pb-1 text-xs text-base-content/60">
            ספירות מילים, מופרדות בפסיקים או שורות
          </span>
          <input
            className="input input-bordered"
            dir="ltr"
            value={counts}
            onChange={(event) => setCounts(event.target.value)}
          />
        </label>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <WordCountMetric label="מתחרים" value={numbers.length || "—"} />
        <WordCountMetric label="ממוצע" value={average || "—"} suffix="מילים" />
        <WordCountMetric
          label="יעד מומלץ"
          value={recommended || "—"}
          suffix="מילים"
        />
      </div>
    </section>
  );
}

function WordCountMetric({
  label,
  suffix,
  value,
}: {
  label: string;
  suffix?: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-200/70 p-4">
      <p className="text-xs text-base-content/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {suffix ? (
        <p className="mt-1 text-xs text-base-content/60">{suffix}</p>
      ) : null}
    </div>
  );
}

function SavedIdeasPage({
  savedIdeas,
  onAddToCalendar,
}: {
  savedIdeas: ContentIdea[];
  onAddToCalendar: (idea: ContentIdea) => void;
}) {
  return (
    <section className="rounded-lg border border-base-300 bg-base-100 p-5">
      <div className="flex items-center gap-2">
        <Lightbulb className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">רעיונות שמורים</h2>
      </div>
      <p className="mt-2 text-sm text-base-content/70">
        מקום נקי לעבור על רעיונות שנשמרו ולהעביר אותם לתוכנית העבודה.
      </p>
      {savedIdeas.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {savedIdeas.map((idea) => (
            <article
              key={idea.id}
              className="rounded-lg border border-base-300 bg-base-200/70 p-4"
            >
              <h3 className="text-sm font-semibold">{idea.title}</h3>
              <p className="mt-2 text-sm text-base-content/65">
                {idea.primaryKeyword} · {idea.contentType}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm mt-4"
                onClick={() => onAddToCalendar(idea)}
              >
                הוסף לתוכנית
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-base-300 bg-base-200/50 p-6 text-center">
          <p className="text-sm font-medium">עדיין אין רעיונות שמורים.</p>
          <p className="mt-1 text-sm text-base-content/60">
            חזרו ליצירת רעיונות ושמרו נושאים שמתאימים להמשך.
          </p>
        </div>
      )}
    </section>
  );
}

function WeeklyPlanPage({
  items,
  savedIdeas,
  onAddToCalendar,
  onDraftRequest,
  onUpdateItem,
}: {
  items: ContentCalendarItem[];
  savedIdeas: ContentIdea[];
  onAddToCalendar: (idea: ContentIdea) => void;
  onDraftRequest: (idea: ContentIdea) => void;
  onUpdateItem: (
    id: string,
    patch: Partial<Pick<ContentCalendarItem, "dueDate" | "status">>,
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-base-300 bg-base-100 p-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">תוכנית השבוע</h2>
        </div>
        <p className="mt-2 text-sm text-base-content/70">
          תצוגה ממוקדת לניהול תאריכי יעד, סטטוס והעברה לכתיבה.
        </p>
      </section>
      <ContentCalendarSection
        items={items}
        savedIdeas={savedIdeas}
        onAddToCalendar={onAddToCalendar}
        onDraftRequest={onDraftRequest}
        onUpdateItem={onUpdateItem}
      />
    </div>
  );
}
