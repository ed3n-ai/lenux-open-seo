import * as React from "react";
import { CalendarDays, FileText } from "lucide-react";
import {
  calendarStatusLabels,
  isCalendarStatus,
  type CalendarStatus,
  type ContentCalendarItem,
  type ContentIdea,
} from "@/client/features/content/contentManagerStorage";

const statusOptions: { label: string; value: CalendarStatus }[] = [
  { label: calendarStatusLabels.idea, value: "idea" },
  { label: calendarStatusLabels.planned, value: "planned" },
  { label: calendarStatusLabels.writing, value: "writing" },
  { label: calendarStatusLabels.editing, value: "editing" },
  { label: calendarStatusLabels.ready, value: "ready" },
  { label: calendarStatusLabels.published, value: "published" },
];

type CalendarView = "week" | "month" | "list";

const calendarViewOptions: { label: string; value: CalendarView }[] = [
  { label: "שבוע", value: "week" },
  { label: "חודש", value: "month" },
  { label: "רשימה", value: "list" },
];

export function ContentCalendarSection({
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
  const [calendarView, setCalendarView] = React.useState<CalendarView>("week");
  const visibleItems = items.toSorted((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  );

  return (
    <section className="rounded-lg border border-base-300 bg-base-100 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">יומן תוכן</h2>
          </div>
          <p className="mt-2 text-sm text-base-content/70">
            תכנון שבועי, חודשי או רשימתי עם סטטוס ותאריך יעד לכל פריט.
          </p>
        </div>
        <div className="join self-start">
          {calendarViewOptions.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              className={`btn join-item btn-sm ${
                calendarView === value ? "btn-primary" : "btn-outline"
              }`}
              onClick={() => setCalendarView(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {savedIdeas.length && !items.length ? (
        <div className="mt-4 rounded-lg border border-base-300 bg-base-200 p-4">
          <p className="text-sm font-medium">רעיונות שמורים</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {savedIdeas.map((idea) => (
              <button
                key={idea.id}
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => onAddToCalendar(idea)}
              >
                {idea.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {visibleItems.length ? (
        <div
          className={`mt-5 grid gap-3 ${
            calendarView === "list" ? "" : "md:grid-cols-2 xl:grid-cols-3"
          }`}
        >
          {visibleItems.map((item) => (
            <CalendarItemCard
              key={item.id}
              item={item}
              onDraftRequest={onDraftRequest}
              onUpdateItem={onUpdateItem}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-base-300 bg-base-200/50 p-6 text-center">
          <p className="text-sm font-medium">עדיין אין פריטים ביומן.</p>
          <p className="mt-1 text-sm text-base-content/60">
            צרו רעיונות, שמרו את הרלוונטיים, והוסיפו אותם לתוכנית העבודה.
          </p>
        </div>
      )}
    </section>
  );
}

function CalendarItemCard({
  item,
  onDraftRequest,
  onUpdateItem,
}: {
  item: ContentCalendarItem;
  onDraftRequest: (idea: ContentIdea) => void;
  onUpdateItem: (
    id: string,
    patch: Partial<Pick<ContentCalendarItem, "dueDate" | "status">>,
  ) => void;
}) {
  return (
    <article className="rounded-lg border border-base-300 bg-base-200/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{item.title}</p>
          <p className="mt-1 text-xs text-base-content/60">
            {item.primaryKeyword} · {item.contentType}
          </p>
        </div>
        <span className="badge badge-outline">
          {calendarStatusLabels[item.status]}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="form-control">
          <span className="label pb-1 text-xs text-base-content/60">
            תאריך יעד
          </span>
          <input
            type="date"
            className="input input-bordered input-sm"
            value={item.dueDate}
            onChange={(event) =>
              onUpdateItem(item.id, { dueDate: event.target.value })
            }
          />
        </label>
        <label className="form-control">
          <span className="label pb-1 text-xs text-base-content/60">סטטוס</span>
          <select
            className="select select-bordered select-sm"
            value={item.status}
            onChange={(event) => {
              if (isCalendarStatus(event.target.value)) {
                onUpdateItem(item.id, { status: event.target.value });
              }
            }}
          >
            {statusOptions.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-sm btn-primary gap-2"
          onClick={() => onDraftRequest(item)}
        >
          <FileText className="size-4" />
          צור טיוטה
        </button>
      </div>
    </article>
  );
}
