import * as React from "react";
import {
  Activity,
  CheckCircle2,
  DatabaseZap,
  Gauge,
  Link2,
  Play,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import {
  STORAGE_KEY,
  baseKeywords,
  defaultState,
  scenarioCopy,
  scenarios,
  type SandboxState,
} from "@/client/features/sandbox/sandboxData";

function getStoredState(): SandboxState {
  if (typeof window === "undefined") return defaultState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;

    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

export function ClientSandboxPage() {
  const [state, setState] = React.useState<SandboxState>(defaultState);
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    setState(getStoredState());
    setIsHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isHydrated, state]);

  const activeCopy = scenarioCopy[state.scenario];
  const weightedScore =
    Math.round(
      baseKeywords.reduce((total, item) => total + item.opportunity, 0) /
        baseKeywords.length,
    ) + (state.depth > 40 ? 4 : 0);

  const runSandbox = () => {
    setIsRunning(true);
    window.setTimeout(() => {
      setIsRunning(false);
      setState((current) => ({
        ...current,
        lastRunAt: new Date().toLocaleString(),
      }));
    }, 650);
  };

  const resetSandbox = () => {
    setState(defaultState);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <main className="min-h-[100dvh] overflow-auto bg-base-200 text-base-content">
      <header className="border-b border-base-300 bg-base-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-sm font-medium text-primary">OpenSEO sandbox</p>
            <h1 className="mt-1 text-2xl font-semibold">
              Client-side feasibility lab
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-ghost gap-2"
              onClick={resetSandbox}
            >
              <RefreshCcw className="size-4" />
              Reset
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary gap-2"
              onClick={runSandbox}
              disabled={isRunning}
            >
              {isRunning ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <Play className="size-4" />
              )}
              Run mock analysis
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 md:grid-cols-[280px_minmax(0,1fr)] md:px-6">
        <aside className="space-y-4">
          <section className="rounded-lg border border-base-300 bg-base-100 p-4">
            <label className="form-control">
              <span className="label pb-1 text-xs font-medium text-base-content/60">
                Domain
              </span>
              <input
                className="input input-bordered w-full"
                value={state.domain}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    domain: event.target.value,
                  }))
                }
              />
            </label>

            <label className="form-control mt-3">
              <span className="label pb-1 text-xs font-medium text-base-content/60">
                Market
              </span>
              <select
                className="select select-bordered w-full"
                value={state.market}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    market: event.target.value,
                  }))
                }
              >
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Israel</option>
                <option>Canada</option>
              </select>
            </label>

            <label className="form-control mt-3">
              <span className="label pb-1 text-xs font-medium text-base-content/60">
                SERP depth
              </span>
              <input
                type="range"
                min={10}
                max={100}
                step={10}
                value={state.depth}
                className="range range-primary range-sm"
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    depth: Number(event.target.value),
                  }))
                }
              />
              <span className="mt-1 text-xs text-base-content/60">
                Top {state.depth}
              </span>
            </label>
          </section>

          <section className="rounded-lg border border-base-300 bg-base-100 p-2">
            {scenarios.map((scenario) => {
              const Icon = scenario.icon;
              const isActive = state.scenario === scenario.id;

              return (
                <button
                  key={scenario.id}
                  type="button"
                  className={`btn btn-sm mb-1 w-full justify-start gap-2 last:mb-0 ${
                    isActive
                      ? "border-transparent bg-primary/10 text-primary"
                      : "btn-ghost text-base-content/70"
                  }`}
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      scenario: scenario.id,
                    }))
                  }
                >
                  <Icon className="size-4" />
                  {scenario.label}
                </button>
              );
            })}
          </section>

          <section className="rounded-lg border border-base-300 bg-base-100 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-success" />
              Sandbox isolation
            </div>
            <div className="mt-3 space-y-2 text-sm text-base-content/70">
              <p>API calls: disabled</p>
              <p>Database writes: disabled</p>
              <p>Persistence: browser localStorage</p>
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="rounded-lg border border-base-300 bg-base-100 p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm text-base-content/60">
                  {state.domain || "example.com"} / {state.market}
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  {activeCopy.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/70">
                  {activeCopy.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:min-w-80">
                <MetricTile
                  icon={Activity}
                  label={activeCopy.secondaryMetric}
                  value={activeCopy.primaryMetric}
                />
                <MetricTile
                  icon={Gauge}
                  label="Opportunity"
                  value={`${weightedScore}`}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.7fr)]">
            <section className="rounded-lg border border-base-300 bg-base-100">
              <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
                <h3 className="font-medium">Mock opportunity queue</h3>
                <span className="badge badge-outline">
                  {baseKeywords.length} items
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Keyword</th>
                      <th>Intent</th>
                      <th className="text-right">Volume</th>
                      <th className="text-right">KD</th>
                      <th className="text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baseKeywords.map((item) => (
                      <tr key={item.keyword}>
                        <td className="font-medium">{item.keyword}</td>
                        <td>{item.intent}</td>
                        <td className="text-right">
                          {item.volume.toLocaleString()}
                        </td>
                        <td className="text-right">{item.difficulty}</td>
                        <td className="text-right">
                          <span className="badge badge-primary">
                            {item.opportunity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-5">
              <div className="rounded-lg border border-base-300 bg-base-100 p-4">
                <h3 className="font-medium">Readiness checks</h3>
                <div className="mt-4 space-y-3">
                  <CheckRow label="Client routing" done />
                  <CheckRow label="Mock data state" done />
                  <CheckRow label="Local persistence" done={isHydrated} />
                  <CheckRow label="Production API guard" done />
                </div>
              </div>

              <div className="rounded-lg border border-base-300 bg-base-100 p-4">
                <div className="flex items-center gap-2">
                  <DatabaseZap className="size-4 text-primary" />
                  <h3 className="font-medium">Last sandbox run</h3>
                </div>
                <p className="mt-3 text-sm text-base-content/70">
                  {state.lastRunAt ?? "No run yet"}
                </p>
              </div>

              <div className="rounded-lg border border-base-300 bg-base-100 p-4">
                <div className="flex items-center gap-2">
                  <Link2 className="size-4 text-primary" />
                  <h3 className="font-medium">API key handoff</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-base-content/70">
                  Keep this route on mock data now. Later, switch to a
                  dedicated test key in env, then replace it with production
                  secrets in Cloudflare or Docker.
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-base-300 bg-base-200 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-base-content/60">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function CheckRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-base-content/70">{label}</span>
      {done ? (
        <CheckCircle2 className="size-4 text-success" />
      ) : (
        <span className="loading loading-spinner loading-xs" />
      )}
    </div>
  );
}
