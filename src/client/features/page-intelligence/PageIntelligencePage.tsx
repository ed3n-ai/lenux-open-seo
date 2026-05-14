import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  FileSearch,
  Globe2,
  ListChecks,
  Search,
  Sparkles,
} from "lucide-react";
import { analyzePageIntelligence } from "@/serverFunctions/page-intelligence";
import {
  getLanguageCode,
  isSupportedLocationCode,
  LOCATION_OPTIONS,
} from "@/client/features/keywords/locations";
import { getStandardErrorMessage } from "@/client/lib/error-messages";

type Props = {
  projectId: string;
  initialSource?: string;
  initialLocationCode: number;
  navigate: (args: {
    search: (prev: Record<string, unknown>) => Record<string, unknown>;
    replace: boolean;
  }) => void;
};

type AnalysisResult = Awaited<ReturnType<typeof analyzePageIntelligence>>;

export function PageIntelligencePage({
  projectId,
  initialSource = "",
  initialLocationCode,
  navigate,
}: Props) {
  const [source, setSource] = React.useState(initialSource);
  const [locationCode, setLocationCode] = React.useState(initialLocationCode);
  const [maxPages, setMaxPages] = React.useState(8);
  const [result, setResult] = React.useState<AnalysisResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      analyzePageIntelligence({
        data: {
          projectId,
          source,
          mode: "auto",
          locationCode,
          languageCode: getLanguageCode(locationCode),
          maxPages,
          keywordsPerPage: 8,
        },
      }),
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = source.trim();
    if (!trimmed) return;

    setError(null);
    setResult(null);
    setSource(trimmed);
    navigate({
      search: (prev) => ({
        ...prev,
        source: trimmed,
        loc: locationCode === 2376 ? undefined : locationCode,
      }),
      replace: true,
    });

    try {
      const nextResult = await mutation.mutateAsync();
      setResult(nextResult);
    } catch (err) {
      setError(getStandardErrorMessage(err, "ניתוח העמודים נכשל."));
    }
  }

  return (
    <main className="h-full overflow-auto bg-base-200 px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-lg border border-base-300 bg-base-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <FileSearch className="size-4" />
                <span>Page Intelligence</span>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                ניתוח עמודים לפי Sitemap
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-base-content/70">
                סורקים עמודים, מזהים ביטויים מובילים, הזדמנויות וקניבליזציה,
                ואז מחליטים מה לעדכן, לאחד או להעביר למנוע הכתיבה.
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="rounded-lg border border-base-300 bg-base-100 p-4"
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_150px_auto] lg:items-end">
            <label className="form-control">
              <span className="label-text mb-1">Sitemap או URL</span>
              <input
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="input input-bordered w-full"
                dir="ltr"
                placeholder="https://example.com/sitemap.xml"
                type="url"
                required
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-1">שוק</span>
              <select
                className="select select-bordered w-full"
                value={locationCode}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setLocationCode(
                    isSupportedLocationCode(next) ? next : initialLocationCode,
                  );
                }}
              >
                {LOCATION_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text mb-1">עמודים</span>
              <select
                className="select select-bordered w-full"
                value={maxPages}
                onChange={(event) => setMaxPages(Number(event.target.value))}
              >
                {[3, 5, 8, 12, 20].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="btn btn-primary gap-2"
              disabled={mutation.isPending || !source.trim()}
            >
              {mutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Search className="size-4" />
              )}
              נתח עמודים
            </button>
          </div>
        </form>

        {error ? (
          <div className="alert alert-error">
            <AlertTriangle className="size-5" />
            <span>{error}</span>
          </div>
        ) : null}

        {mutation.isPending ? <LoadingState /> : null}
        {result ? <ResultsView result={result} /> : null}
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-28 rounded-lg border border-base-300 bg-base-100 p-5"
        >
          <div className="skeleton h-5 w-28" />
          <div className="skeleton mt-4 h-8 w-16" />
        </div>
      ))}
    </section>
  );
}

function ResultsView({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="עמודים שנסרקו"
          value={result.pagesAnalyzed}
          icon={Globe2}
        />
        <MetricCard
          label="ביטויים שנמצאו"
          value={result.keywordsFound}
          icon={Sparkles}
        />
        <MetricCard
          label="קניבליזציות"
          value={result.cannibalizationCount}
          icon={AlertTriangle}
        />
        <MetricCard
          label="סטטוס דאטה"
          value={result.dataStatus === "complete" ? "מלא" : "חלקי"}
          icon={ListChecks}
        />
      </section>

      {result.warnings.length > 0 ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-base-content/75">
          <strong>הערה:</strong> חלק מהעמודים חזרו בלי נתוני DataForSEO.
          הניתוח עדיין מציג מטא דאטה והמלצות בסיסיות.
        </div>
      ) : null}

      {result.cannibalizations.length > 0 ? (
        <section className="rounded-lg border border-base-300 bg-base-100 p-4">
          <h2 className="text-lg font-semibold">קניבליזציות לטיפול</h2>
          <div className="mt-3 grid gap-3">
            {result.cannibalizations.map((issue) => (
              <article
                key={issue.keyword}
                className="rounded-lg border border-base-300 bg-base-200/50 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">{issue.keyword}</h3>
                  <span className="badge badge-outline">
                    {severityLabel(issue.severity)}
                  </span>
                </div>
                <div className="mt-2 grid gap-2 text-sm">
                  {issue.pages.map((page) => (
                    <div
                      key={page.url}
                      className="flex flex-col gap-1 rounded border border-base-300 bg-base-100 px-3 py-2 md:flex-row md:items-center md:justify-between"
                    >
                      <span className="truncate" dir="ltr">
                        {page.url}
                      </span>
                      <span className="text-base-content/60">
                        מיקום {page.position ?? "-"}
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-base-300 bg-base-100">
        <div className="border-b border-base-300 p-4">
          <h2 className="text-lg font-semibold">עמודים ותובנות</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>עמוד</th>
                <th>ביטוי מוביל</th>
                <th>ביטויים נוספים</th>
                <th>המלצה</th>
              </tr>
            </thead>
            <tbody>
              {result.pages.map((page) => (
                <tr key={page.url}>
                  <td className="min-w-72">
                    <div className="font-medium">{page.title ?? page.h1}</div>
                    <div className="mt-1 max-w-md truncate text-xs text-base-content/60" dir="ltr">
                      {page.url}
                    </div>
                    <div className="mt-1 text-xs text-base-content/50">
                      {page.wordCount.toLocaleString()} מילים · Status{" "}
                      {page.statusCode ?? "-"}
                    </div>
                  </td>
                  <td>
                    {page.primaryKeyword ? (
                      <div className="space-y-1">
                        <div className="font-medium">
                          {page.primaryKeyword.keyword}
                        </div>
                        <div className="text-xs text-base-content/60">
                          מיקום {page.primaryKeyword.position ?? "-"} · נפח{" "}
                          {page.primaryKeyword.searchVolume ?? "-"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-base-content/50">אין דאטה</span>
                    )}
                  </td>
                  <td>
                    <div className="flex max-w-sm flex-wrap gap-1">
                      {page.topKeywords.slice(0, 4).map((keyword) => (
                        <span
                          key={keyword.keyword}
                          className="badge badge-ghost"
                        >
                          {keyword.keyword}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="max-w-md text-sm leading-6 text-base-content/75">
                    {page.recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Globe2;
}) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-100 p-4">
      <div className="flex items-center gap-2 text-sm text-base-content/60">
        <Icon className="size-4 text-primary" />
        <span>{label}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function severityLabel(severity: "high" | "medium" | "low") {
  if (severity === "high") return "גבוה";
  if (severity === "medium") return "בינוני";
  return "נמוך";
}
