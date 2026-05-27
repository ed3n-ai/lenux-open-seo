import * as React from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  FileText,
  Globe,
  Lightbulb,
  Link2,
  Search,
  Settings2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { ComponentType } from "react";
import {
  roleLabels,
  type ContentWorkflowRole,
} from "@/client/features/content/contentManagerStorage";
import {
  getProjectAccess,
  setProjectWorkflowRole,
} from "@/serverFunctions/projects";

export const Route = createFileRoute("/_project/p/$projectId/")({
  component: CommunityDashboardPage,
});

const setupItems = [
  "חיבור DataForSEO API key",
  "הרצת מחקר מילות מפתח ראשון",
  "הוספת דומיין למעקב",
  "פתיחת יומן תוכן או בדיקת אתר",
] as const;

const seoOperatorTools = [
  {
    label: "ניתוח עמודים",
    description: "זהו עמודים מתחרים, שאילתות מובילות והזדמנויות לשיפור.",
    icon: FileSearch,
    to: "/p/$projectId/page-intelligence" as const,
  },
  {
    label: "מחקר מילות מפתח",
    description: "מצאו הזדמנויות חיפוש ונושאים ששווה לתעדף.",
    icon: Search,
    to: "/p/$projectId/keywords" as const,
  },
  {
    label: "מעקב דירוגים",
    description: "עקבו אחרי מילות מפתח חשובות לאורך זמן.",
    icon: TrendingUp,
    to: "/p/$projectId/rank-tracking" as const,
  },
  {
    label: "סקירת דומיין",
    description: "בדקו נראות, עמודים מדורגים והזדמנויות לשיפור.",
    icon: Globe,
    to: "/p/$projectId/domain" as const,
  },
  {
    label: "בדיקת אתר",
    description: "אתרו בעיות טכניות לפני שהן פוגעות בביצועים.",
    icon: ClipboardCheck,
    to: "/p/$projectId/audit" as const,
  },
] as const;

function CommunityDashboardPage() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();
  const projectQueryKey = ["project-access", projectId] as const;
  const projectQuery = useQuery({
    queryKey: projectQueryKey,
    queryFn: () => getProjectAccess({ data: { projectId } }),
  });
  const chooseRoleMutation = useMutation({
    mutationFn: (workflowRole: ContentWorkflowRole) =>
      setProjectWorkflowRole({ data: { projectId, workflowRole } }),
    onSuccess: async (project) => {
      queryClient.setQueryData(projectQueryKey, project);
      await queryClient.invalidateQueries({ queryKey: projectQueryKey });
    },
  });
  const role = projectQuery.data?.workflowRole ?? null;
  const isSuperAdmin = projectQuery.data?.isSuperAdmin === true;
  const roleBadgeLabel = isSuperAdmin
    ? "מנהל מערכת"
    : role
      ? roleLabels[role]
      : "";

  function chooseRole(nextRole: ContentWorkflowRole) {
    chooseRoleMutation.mutate(nextRole);
  }

  if (projectQuery.isLoading) {
    return (
      <main className="h-full overflow-auto bg-base-200 px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="skeleton h-56 w-full rounded-lg" />
        </div>
      </main>
    );
  }

  if (!role && !isSuperAdmin) {
    return (
      <main className="h-full overflow-auto bg-base-200 px-4 py-6 md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-5">
          <section className="rounded-lg border border-base-300 bg-base-100 p-6">
            <p className="text-sm font-medium text-primary">
              OpenSEO Community Edition
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-base-content">
              איך תרצו לעבוד בפרויקט הזה?
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-base-content/70">
              הבחירה נשמרת עבור הפרויקט. לאחר הבחירה שינוי מסלול יתבצע רק דרך
              תמיכה.
            </p>
            {chooseRoleMutation.isError ? (
              <div className="alert alert-error mt-4 text-sm">
                לא הצלחנו לשמור את המסלול. נסו שוב או פנו לתמיכה.
              </div>
            ) : null}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <RoleChoiceCard
              title="מנהל תוכן"
              description="אני רוצה למצוא רעיונות, לבנות תוכנית כתיבה, וליצור טיוטות תוכן."
              result="תקבלו דשבורד ממוקד רעיונות, יומן תוכן, טיוטות והכנה לפרסום."
              icon={FileText}
              isLoading={chooseRoleMutation.isPending}
              onChoose={() => chooseRole("content-manager")}
            />
            <RoleChoiceCard
              title="איש SEO"
              description="אני רוצה לנתח ביצועים, לעקוב אחרי דירוגים, ולזהות הזדמנויות ובעיות."
              result="תקבלו דשבורד ממוקד מחקר, דירוגים, דומיין, Backlinks ו-Audit."
              icon={BarChart3}
              isLoading={chooseRoleMutation.isPending}
              onChoose={() => chooseRole("seo-operator")}
            />
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full overflow-auto bg-base-200 px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-lg border border-base-300 bg-base-100 p-5 md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge badge-primary badge-outline">
                  OpenSEO Community Edition
                </span>
                <span className="badge badge-ghost">{roleBadgeLabel}</span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-base-content">
                {isSuperAdmin
                  ? "מרכז עבודה מלא"
                  : role === "content-manager"
                  ? "מרכז עבודה למנהל תוכן"
                  : "מרכז עבודה לאיש SEO"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-base-content/70">
                {isSuperAdmin
                  ? "כל יכולות ניהול התוכן וה-SEO פתוחות במצב מנהל, ללא בחירת מסלול וללא מגבלות תשלום."
                  : role === "content-manager"
                  ? "התחילו ברעיון, שמרו נושאים טובים, תכננו אותם ביומן, צרו טיוטה, והכינו payload מסודר ל-WordPress עם Yoast."
                  : "התחילו ממחקר, עקבו אחרי תנועה ודירוגים, בדקו את הדומיין, וטפלו בבעיות טכניות בצורה מדידה."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={
                  role === "content-manager" || isSuperAdmin
                    ? "/p/$projectId/ai"
                    : "/p/$projectId/keywords"
                }
                params={{ projectId }}
                search={
                  role === "content-manager" || isSuperAdmin
                    ? { view: "ideas" }
                    : undefined
                }
                className="btn btn-primary gap-2"
              >
                {role === "content-manager" || isSuperAdmin
                  ? "צור רעיונות לתוכן"
                  : "התחל מחקר מילות מפתח"}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        {isSuperAdmin ? (
          <>
            <ContentManagerDashboard projectId={projectId} />
            <SeoOperatorDashboard projectId={projectId} />
          </>
        ) : role === "content-manager" ? (
          <ContentManagerDashboard projectId={projectId} />
        ) : (
          <SeoOperatorDashboard projectId={projectId} />
        )}

        {role === "seo-operator" && !isSuperAdmin ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div className="rounded-lg border border-base-300 bg-base-100 p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-success" />
                <h2 className="text-lg font-semibold">צ'קליסט התחלה</h2>
              </div>
              <div className="mt-4 space-y-3">
                {setupItems.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-lg border border-base-300 bg-base-200/70 px-3 py-2"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-base-100 text-xs font-semibold text-base-content/60">
                      {index + 1}
                    </span>
                    <span className="text-sm text-base-content/75">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-base-300 bg-base-100 p-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-5 text-primary" />
                <h2 className="text-lg font-semibold">גבולות הגרסה הציבורית</h2>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  {
                    title: "מסלולים ברורים",
                    body: "שני מסלולים בלבד שומרים על מוצר מובן למנהלי תוכן וגם שימושי לאנשי SEO.",
                  },
                  {
                    title: "מודעות לעלות",
                    body: "פעולות שמבוססות API צריכות להרגיש מכוונות, צפויות וניתנות לשליטה.",
                  },
                  {
                    title: "מתאים ל-self-host",
                    body: "Community Edition נשארת פשוטה לפריסה בלי marketplace או אוטומציות סוכנות כבדות.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-lg border border-base-300 bg-base-200/70 p-4"
                  >
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-base-content/65">
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function RoleChoiceCard({
  title,
  description,
  result,
  icon: Icon,
  isLoading,
  onChoose,
}: {
  title: string;
  description: string;
  result: string;
  icon: ComponentType<{ className?: string }>;
  isLoading: boolean;
  onChoose: () => void;
}) {
  return (
    <article className="rounded-lg border border-base-300 bg-base-100 p-5">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-base-content/70">
            {description}
          </p>
          <p className="mt-3 text-sm leading-6 text-base-content/60">
            {result}
          </p>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-primary mt-5 w-full"
        disabled={isLoading}
        onClick={onChoose}
      >
        {isLoading ? <span className="loading loading-spinner loading-xs" /> : null}
        בחר מסלול
      </button>
    </article>
  );
}

function ContentManagerDashboard({ projectId }: { projectId: string }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <WorkflowToolCard
        title="טיוטה חדשה"
        body="פתחו כתיבה ממוקדת לפי נושא, טון, מילות מפתח ויעד מילים."
        icon={Sparkles}
        to="/p/$projectId/ai"
        search={{ view: "writer" }}
        projectId={projectId}
      />
      <WorkflowToolCard
        title="רעיונות שמורים"
        body="שמרו נושאים לעבודה והפכו אותם לפריטים ביומן התוכן."
        icon={Lightbulb}
        to="/p/$projectId/ai"
        search={{ view: "saved-ideas" }}
        projectId={projectId}
      />
      <WorkflowToolCard
        title="תוכנית השבוע"
        body="נהלו סטטוסים ותאריכי יעד, ואז עברו מהיומן לטיוטה."
        icon={CalendarDays}
        to="/p/$projectId/ai"
        search={{ view: "weekly-plan" }}
        projectId={projectId}
      />
      <WorkflowToolCard
        title="ניתוח עמודים"
        body="סרקו Sitemap, מצאו ביטויים מובילים וקניבליזציות לפני כתיבה או עדכון."
        icon={FileSearch}
        to="/p/$projectId/page-intelligence"
        projectId={projectId}
      />
    </section>
  );
}

function SeoOperatorDashboard({ projectId }: { projectId: string }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {seoOperatorTools.map((tool) => (
        <WorkflowToolCard key={tool.label} {...tool} projectId={projectId} />
      ))}
      <WorkflowToolCard
        title="Backlinks"
        body="בדקו דומיינים מפנים ותנועת קישורים נכנסים."
        icon={Link2}
        to="/p/$projectId/backlinks"
        projectId={projectId}
      />
      <WorkflowToolCard
        title="AI"
        body="צרו טיוטות תוכן והכינו חומרים לפרסום."
        icon={Settings2}
        to="/p/$projectId/ai"
        projectId={projectId}
      />
    </section>
  );
}

type DashboardTool = {
  title?: string;
  label?: string;
  body?: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  to:
    | "/p/$projectId/keywords"
    | "/p/$projectId/ai"
    | "/p/$projectId/page-intelligence"
    | "/p/$projectId/rank-tracking"
    | "/p/$projectId/domain"
    | "/p/$projectId/backlinks"
    | "/p/$projectId/audit";
  projectId: string;
  search?: { view?: "ideas" | "saved-ideas" | "weekly-plan" | "writer" };
};

function WorkflowToolCard({
  title,
  label,
  body,
  description,
  icon: Icon,
  search,
  to,
  projectId,
}: DashboardTool) {
  return (
    <Link
      to={to}
      params={{ projectId }}
      search={search}
      className="group rounded-lg border border-base-300 bg-base-100 p-5 transition-colors hover:border-primary/50 hover:bg-base-100/80"
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-base-200 text-base-content/70 group-hover:text-primary">
        <Icon className="size-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title ?? label}</h2>
      <p className="mt-2 text-sm leading-6 text-base-content/65">
        {body ?? description}
      </p>
    </Link>
  );
}
