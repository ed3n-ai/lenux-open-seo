import * as React from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import {
  createContentIdeas,
  goalLabels,
  isContentGoal,
  type ContentGoal,
  type ContentIdea,
} from "@/client/features/content/contentManagerStorage";

const goalOptions: { label: string; value: ContentGoal }[] = [
  { label: goalLabels.traffic, value: "traffic" },
  { label: goalLabels.leads, value: "leads" },
  { label: goalLabels.authority, value: "authority" },
  { label: goalLabels.product, value: "product" },
];

export function ContentIdeasSection({
  onAddToCalendar,
  onSaveIdea,
}: {
  onAddToCalendar: (idea: ContentIdea) => void;
  onSaveIdea: (idea: ContentIdea) => void;
}) {
  const [domain, setDomain] = React.useState("");
  const [audience, setAudience] = React.useState("לקוחות קיימים ופוטנציאליים");
  const [language, setLanguage] = React.useState("עברית");
  const [tone, setTone] = React.useState("ברור ומקצועי");
  const [goal, setGoal] = React.useState<ContentGoal>("traffic");
  const [ideas, setIdeas] = React.useState<ContentIdea[]>([]);

  function generateIdeas() {
    setIdeas(createContentIdeas({ audience, domain, goal, language, tone }));
  }

  return (
    <section className="rounded-lg border border-base-300 bg-base-100 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">יצירת רעיונות</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-base-content/70">
            הגדירו כיוון קצר, קבלו רעיונות ראשוניים, ושמרו את הנושאים שמתאימים
            לתוכנית התוכן.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary gap-2 self-start lg:self-auto"
          disabled={domain.trim().length < 2}
          onClick={generateIdeas}
        >
          <Sparkles className="size-4" />
          צור רעיונות לתוכן
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="form-control xl:col-span-2">
          <span className="label pb-1 text-xs font-medium text-base-content/60">
            תחום או נושא
          </span>
          <input
            className="input input-bordered w-full"
            value={domain}
            placeholder="לדוגמה: מחקר מילות מפתח לאתרי SaaS"
            onChange={(event) => setDomain(event.target.value)}
          />
        </label>
        <label className="form-control xl:col-span-2">
          <span className="label pb-1 text-xs font-medium text-base-content/60">
            קהל יעד
          </span>
          <input
            className="input input-bordered w-full"
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
          />
        </label>
        <label className="form-control">
          <span className="label pb-1 text-xs font-medium text-base-content/60">
            מטרה
          </span>
          <select
            className="select select-bordered w-full"
            value={goal}
            onChange={(event) => {
              if (isContentGoal(event.target.value)) {
                setGoal(event.target.value);
              }
            }}
          >
            {goalOptions.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="form-control">
          <span className="label pb-1 text-xs font-medium text-base-content/60">
            שפה
          </span>
          <input
            className="input input-bordered w-full"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
          />
        </label>
        <label className="form-control md:col-span-2 xl:col-span-4">
          <span className="label pb-1 text-xs font-medium text-base-content/60">
            טון
          </span>
          <input
            className="input input-bordered w-full"
            value={tone}
            onChange={(event) => setTone(event.target.value)}
          />
        </label>
      </div>

      {ideas.length ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onAddToCalendar={onAddToCalendar}
              onSaveIdea={onSaveIdea}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function IdeaCard({
  idea,
  onAddToCalendar,
  onSaveIdea,
}: {
  idea: ContentIdea;
  onAddToCalendar: (idea: ContentIdea) => void;
  onSaveIdea: (idea: ContentIdea) => void;
}) {
  return (
    <article className="rounded-lg border border-base-300 bg-base-200/70 p-4">
      <p className="text-sm font-semibold">{idea.title}</p>
      <dl className="mt-3 space-y-2 text-sm text-base-content/70">
        <div>
          <dt className="text-xs text-base-content/50">מילת מפתח ראשית</dt>
          <dd>{idea.primaryKeyword}</dd>
        </div>
        <div>
          <dt className="text-xs text-base-content/50">סוג תוכן</dt>
          <dd>{idea.contentType}</dd>
        </div>
        <div>
          <dt className="text-xs text-base-content/50">כוונת חיפוש</dt>
          <dd>{idea.intent}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => onSaveIdea(idea)}
        >
          שמור רעיון
        </button>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={() => onAddToCalendar(idea)}
        >
          הוסף ליומן
        </button>
      </div>
    </article>
  );
}
