import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { ClassicEditorWorkspace } from "@/client/features/content/ClassicEditorWorkspace";
import {
  ContentManagerWorkspace,
  type ContentManagerView,
} from "@/client/features/content/ContentManagerWorkspace";
import {
  ContentWriterPanel,
  type ContentWriterDraftResult,
} from "@/client/features/content/ContentWriterPanel";
import type {
  ContentCalendarItem,
  ContentIdea,
} from "@/client/features/content/contentManagerStorage";
import { createCalendarItemFromDraft } from "@/client/features/content/contentManagerStorage";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_project/p/$projectId/ai")({
  validateSearch: (search: Record<string, unknown>) => ({
    view: parseContentManagerView(search.view),
  }),
  component: AiPage,
});

function parseContentManagerView(value: unknown): ContentManagerView {
  return value === "ideas" ||
    value === "saved-ideas" ||
    value === "weekly-plan" ||
    value === "writer"
    ? value
    : "overview";
}

function AiPage() {
  const { projectId } = Route.useParams();
  const { view } = Route.useSearch();
  const { data: session } = useSession();
  const userKey = session?.user?.id ?? session?.user?.email ?? "local-user";
  const writerRef = React.useRef<HTMLDivElement | null>(null);
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const [draftPrefill, setDraftPrefill] = React.useState<{
    topic: string;
    keywords?: string[];
  } | null>(null);
  const [selectedCalendarItem, setSelectedCalendarItem] =
    React.useState<ContentCalendarItem | null>(null);
  const [selectedContentDraft, setSelectedContentDraft] =
    React.useState<ContentWriterDraftResult | null>(null);

  function requestDraft(idea: ContentIdea) {
    setSelectedCalendarItem(
      "dueDate" in idea && "status" in idea
        ? (idea as ContentCalendarItem)
        : null,
    );
    setSelectedContentDraft(null);
    setDraftPrefill({
      keywords: [idea.primaryKeyword, ...idea.secondaryKeywords],
      topic: idea.title,
    });
    window.setTimeout(() => {
      writerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function openPublishingEditor(draft: ContentWriterDraftResult) {
    setSelectedCalendarItem((current) => {
      if (current) return current;
      return createCalendarItemFromDraft(draft);
    });
    setSelectedContentDraft(draft);
    window.setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  return (
    <div className="h-full overflow-auto bg-base-200 px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-lg border border-base-300 bg-base-100 p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <p className="text-sm font-medium text-primary">תוכן ו-AI</p>
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-base-content">
                מסלול עבודה למנהל תוכן
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-base-content/70">
                הגדירו כיוון, צרו רעיונות, שמרו נושאים, תכננו יומן תוכן, כתבו
                טיוטה, ופתחו אותה בעורך פרסום בסגנון WordPress עם שדות Yoast.
              </p>
            </div>
          </div>
        </section>

        <ContentManagerWorkspace
          projectId={projectId}
          userKey={userKey}
          view={view}
          onDraftRequest={requestDraft}
        />

        <div ref={writerRef} id="draft-writer">
          <ContentWriterPanel
            projectId={projectId}
            draftPrefill={draftPrefill}
            openedPublishingDraftId={selectedContentDraft?.id}
            onRecentDraftLoaded={() => {
              setSelectedCalendarItem(null);
              setSelectedContentDraft(null);
            }}
            onOpenPublishingEditor={openPublishingEditor}
          />
        </div>
        <div ref={editorRef} id="publishing-editor">
          <ClassicEditorWorkspace
            calendarItem={selectedCalendarItem}
            contentDraft={selectedContentDraft}
            projectId={projectId}
            userKey={userKey}
          />
        </div>
      </div>
    </div>
  );
}
