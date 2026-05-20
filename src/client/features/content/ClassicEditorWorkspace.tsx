import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Clipboard, ExternalLink, PlugZap, Save, Send } from "lucide-react";
import {
  getWordPressConnection,
  publishWordPressDraft,
  saveWordPressConnection,
  testWordPressConnection,
} from "@/serverFunctions/content";
import { getStandardErrorMessage } from "@/client/lib/error-messages";
import type { ContentCalendarItem } from "./contentManagerStorage";
import { getProjectUserStorageKey } from "./contentManagerStorage";
import {
  buildClassicEditorPayload,
  createClassicEditorDraft,
  findClassicEditorDraft,
  parseStoredClassicEditorDrafts,
  upsertClassicEditorDraft,
  type ClassicEditorContentDraft,
  type WordPressClassicPostDraft,
} from "./classicEditorModel";

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinCsv(value: readonly string[]) {
  return value.join(", ");
}

function getStringProperty(value: unknown, key: string) {
  if (!value || typeof value !== "object" || !(key in value)) return "";
  const property = (value as Record<string, unknown>)[key];
  return typeof property === "string" ? property : "";
}

function getNumberProperty(value: unknown, key: string) {
  if (!value || typeof value !== "object" || !(key in value)) return undefined;
  const property = (value as Record<string, unknown>)[key];
  return typeof property === "number" ? property : undefined;
}

export function ClassicEditorWorkspace({
  calendarItem,
  contentDraft,
  projectId,
  userKey,
}: {
  calendarItem: ContentCalendarItem | null;
  contentDraft: ClassicEditorContentDraft | null;
  projectId: string;
  userKey: string;
}) {
  const storageKey = getProjectUserStorageKey(
    projectId,
    userKey,
    "classic-editor-drafts",
  );
  const [drafts, setDrafts] = React.useState<WordPressClassicPostDraft[]>([]);
  const [draft, setDraft] = React.useState<WordPressClassicPostDraft | null>(
    null,
  );
  const [savedState, setSavedState] = React.useState<"idle" | "saved">("idle");
  const [copyState, setCopyState] = React.useState<"idle" | "copied">("idle");
  const [connectionForm, setConnectionForm] = React.useState({
    displayName: "Lenux28 SEO",
    sharedSecret: "",
    siteUrl: "",
  });

  const connectionQuery = useQuery({
    queryKey: ["wordpress-connection", projectId],
    queryFn: () => getWordPressConnection({ data: { projectId } }),
  });

  React.useEffect(() => {
    if (!connectionQuery.data) return;
    setConnectionForm((current) => ({
      displayName: connectionQuery.data?.displayName || current.displayName,
      sharedSecret: current.sharedSecret,
      siteUrl: connectionQuery.data?.siteUrl || current.siteUrl,
    }));
  }, [connectionQuery.data]);

  React.useEffect(() => {
    setDrafts(
      parseStoredClassicEditorDrafts(window.localStorage.getItem(storageKey)),
    );
  }, [storageKey]);

  React.useEffect(() => {
    writeJson(storageKey, drafts);
  }, [storageKey, drafts]);

  React.useEffect(() => {
    if (!calendarItem || !contentDraft) return;

    setDrafts((current) => {
      const existing = findClassicEditorDraft(
        current,
        calendarItem.id,
        contentDraft.id,
      );
      const nextDraft =
        existing ?? createClassicEditorDraft({ calendarItem, contentDraft });
      setDraft(nextDraft);
      return existing ? current : upsertClassicEditorDraft(current, nextDraft);
    });
    setSavedState("idle");
    setCopyState("idle");
  }, [calendarItem, contentDraft]);

  function updateDraft(updater: (current: WordPressClassicPostDraft) => WordPressClassicPostDraft) {
    setDraft((current) => {
      if (!current) return current;
      setSavedState("idle");
      setCopyState("idle");
      return updater(current);
    });
  }

  function saveLocalDraft() {
    if (!draft) return;
    setDrafts((current) => upsertClassicEditorDraft(current, draft));
    setSavedState("saved");
    window.setTimeout(() => setSavedState("idle"), 1800);
  }

  async function copyPayload() {
    if (!draft) return;
    await navigator.clipboard.writeText(
      JSON.stringify(buildClassicEditorPayload(draft), null, 2),
    );
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  const saveConnectionMutation = useMutation({
    mutationFn: () =>
      saveWordPressConnection({
        data: {
          projectId,
          displayName: connectionForm.displayName,
          siteUrl: connectionForm.siteUrl,
          sharedSecret: connectionForm.sharedSecret || undefined,
        },
      }),
    onSuccess: () => {
      setConnectionForm((current) => ({ ...current, sharedSecret: "" }));
      void connectionQuery.refetch();
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: () => testWordPressConnection({ data: { projectId } }),
    onSuccess: () => {
      void connectionQuery.refetch();
    },
  });

  const publishMutation = useMutation({
    mutationFn: (currentDraft: WordPressClassicPostDraft) =>
      publishWordPressDraft({
        data: {
          projectId,
          payload: buildClassicEditorPayload(currentDraft),
        },
      }),
    onSuccess: (result, currentDraft) => {
      const syncedDraft: WordPressClassicPostDraft = {
        ...currentDraft,
        sync: {
          editUrl: getStringProperty(result, "edit_url"),
          lastSyncStatus: "synced",
          lastSyncedAt: new Date().toISOString(),
          wpPostId: getNumberProperty(result, "post_id"),
        },
      };
      setDraft(syncedDraft);
      setDrafts((current) => upsertClassicEditorDraft(current, syncedDraft));
    },
    onError: (error, currentDraft) => {
      const erroredDraft: WordPressClassicPostDraft = {
        ...currentDraft,
        sync: {
          ...currentDraft.sync,
          lastSyncError: getStandardErrorMessage(error),
          lastSyncStatus: "error",
        },
      };
      setDraft(erroredDraft);
      setDrafts((current) => upsertClassicEditorDraft(current, erroredDraft));
    },
  });

  function publishCurrentDraft() {
    if (!draft || publishMutation.isPending) return;
    const syncingDraft: WordPressClassicPostDraft = {
      ...draft,
      sync: {
        ...draft.sync,
        lastSyncError: undefined,
        lastSyncStatus: "syncing",
      },
    };
    setDraft(syncingDraft);
    publishMutation.mutate(syncingDraft);
  }

  if (!calendarItem || !contentDraft || !draft) {
    return null;
  }

  const payload = buildClassicEditorPayload(draft);

  return (
    <section className="rounded-lg border border-base-300 bg-base-100 p-4 md:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Send className="size-5 text-primary" />
            <h2 className="text-xl font-semibold">עורך פרסום</h2>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-base-content/70">
            עריכת טיוטת WordPress בסגנון Classic Editor, כולל Yoast, טקסונומיה
            ו־payload יציב לתוסף.
          </p>
        </div>
        <div className="badge badge-outline self-start">טיוטת AI לעריכה</div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          <ClassicEditorTitlePanel draft={draft} onUpdate={updateDraft} />
          <ClassicEditorContentPanel draft={draft} onUpdate={updateDraft} />
          <YoastSeoBox draft={draft} onUpdate={updateDraft} />
          <PayloadPreview
            copyState={copyState}
            onCopy={() => void copyPayload()}
            payload={payload}
          />
        </div>

        <aside className="space-y-4">
          <WordPressConnectionBox
            connection={connectionQuery.data}
            form={connectionForm}
            isLoading={connectionQuery.isLoading}
            onFormChange={setConnectionForm}
            onSave={() => saveConnectionMutation.mutate()}
            onTest={() => testConnectionMutation.mutate()}
            saveError={
              saveConnectionMutation.isError
                ? getStandardErrorMessage(saveConnectionMutation.error)
                : ""
            }
            savePending={saveConnectionMutation.isPending}
            testError={
              testConnectionMutation.isError
                ? getStandardErrorMessage(testConnectionMutation.error)
                : ""
            }
            testPending={testConnectionMutation.isPending}
          />
          <ClassicEditorPublishBox
            canPublish={Boolean(connectionQuery.data?.hasSharedSecret)}
            connection={connectionQuery.data}
            draft={draft}
            onCopy={() => void copyPayload()}
            onPublish={publishCurrentDraft}
            onSave={saveLocalDraft}
            onUpdate={updateDraft}
            publishPending={publishMutation.isPending}
            savedState={savedState}
          />
          {draft.publish.postType === "post" ? (
            <ClassicEditorTaxonomyBox draft={draft} onUpdate={updateDraft} />
          ) : (
            <ClassicEditorPageTargetBox />
          )}
        </aside>
      </div>
    </section>
  );
}

function WordPressConnectionBox({
  connection,
  form,
  isLoading,
  onFormChange,
  onSave,
  onTest,
  saveError,
  savePending,
  testError,
  testPending,
}: {
  connection:
    | Awaited<ReturnType<typeof getWordPressConnection>>
    | null
    | undefined;
  form: { displayName: string; sharedSecret: string; siteUrl: string };
  isLoading: boolean;
  onFormChange: React.Dispatch<
    React.SetStateAction<{
      displayName: string;
      sharedSecret: string;
      siteUrl: string;
    }>
  >;
  onSave: () => void;
  onTest: () => void;
  saveError: string;
  savePending: boolean;
  testError: string;
  testPending: boolean;
}) {
  const canTest = Boolean(connection?.hasSharedSecret) && !testPending;

  return (
    <section className="rounded-md border border-base-300 bg-base-100">
      <div className="flex items-center gap-2 border-b border-base-300 px-4 py-3 font-semibold">
        <PlugZap className="size-4 text-primary" />
        חיבור WordPress
      </div>
      <div className="space-y-3 p-4">
        <label className="form-control">
          <span className="label pb-1 text-xs text-base-content/60">
            שם תצוגה
          </span>
          <input
            className="input input-bordered input-sm"
            value={form.displayName}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                displayName: event.target.value,
              }))
            }
          />
        </label>
        <label className="form-control">
          <span className="label pb-1 text-xs text-base-content/60">
            כתובת אתר
          </span>
          <input
            className="input input-bordered input-sm"
            dir="ltr"
            placeholder="https://example.com"
            value={form.siteUrl}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                siteUrl: event.target.value,
              }))
            }
          />
        </label>
        <label className="form-control">
          <span className="label pb-1 text-xs text-base-content/60">
            Shared secret
          </span>
          <input
            className="input input-bordered input-sm"
            type="password"
            placeholder={
              connection?.hasSharedSecret ? "קיים, מלא רק כדי להחליף" : ""
            }
            value={form.sharedSecret}
            onChange={(event) =>
              onFormChange((current) => ({
                ...current,
                sharedSecret: event.target.value,
              }))
            }
          />
        </label>

        {connection ? (
          <div className="rounded-md border border-base-300 bg-base-200 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span>{connection.displayName}</span>
              <span
                className={
                  connection.lastStatus === "connected"
                    ? "text-success"
                    : connection.lastStatus === "failed"
                      ? "text-error"
                      : "text-base-content/60"
                }
              >
                {connection.lastStatus === "connected"
                  ? "מחובר"
                  : connection.lastStatus === "failed"
                    ? "נכשל"
                    : "לא נבדק"}
              </span>
            </div>
            <p className="mt-1 truncate text-base-content/60" dir="ltr">
              {connection.siteUrl}
            </p>
            {connection.lastError ? (
              <p className="mt-2 text-error">{connection.lastError}</p>
            ) : null}
          </div>
        ) : null}

        {saveError || testError ? (
          <div className="alert alert-error py-2 text-sm">
            <span>{saveError || testError}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <button
            className="btn btn-outline btn-sm"
            disabled={isLoading || savePending}
            onClick={onSave}
            type="button"
          >
            {savePending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
            שמור
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={!canTest}
            onClick={onTest}
            type="button"
          >
            {testPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
            בדוק חיבור
          </button>
        </div>
      </div>
    </section>
  );
}

function ClassicEditorTitlePanel({
  draft,
  onUpdate,
}: {
  draft: WordPressClassicPostDraft;
  onUpdate: (
    updater: (current: WordPressClassicPostDraft) => WordPressClassicPostDraft,
  ) => void;
}) {
  return (
    <section className="rounded-md border border-base-300 bg-base-100 p-4">
      <label className="form-control">
        <span className="label pb-1 text-xs font-medium text-base-content/60">
          כותרת הפוסט
        </span>
        <input
          className="input input-bordered h-12 w-full text-lg md:text-2xl"
          value={draft.editor.title}
          onChange={(event) =>
            onUpdate((current) => ({
              ...current,
              editor: { ...current.editor, title: event.target.value },
              yoast: {
                ...current.yoast,
                seoTitle:
                  current.yoast.seoTitle === current.editor.title
                    ? event.target.value
                    : current.yoast.seoTitle,
              },
            }))
          }
        />
      </label>
      <label className="form-control mt-3">
        <span className="label pb-1 text-xs font-medium text-base-content/60">
          Permalink / slug
        </span>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <span className="text-xs text-base-content/60" dir="ltr">
            /blog/
          </span>
          <input
            className="input input-bordered input-sm w-full font-mono"
            dir="ltr"
            value={draft.editor.slug}
            onChange={(event) =>
              onUpdate((current) => ({
                ...current,
                editor: { ...current.editor, slug: event.target.value },
              }))
            }
          />
        </div>
      </label>
    </section>
  );
}

function ClassicEditorContentPanel({
  draft,
  onUpdate,
}: {
  draft: WordPressClassicPostDraft;
  onUpdate: (
    updater: (current: WordPressClassicPostDraft) => WordPressClassicPostDraft,
  ) => void;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-base-300 bg-base-100">
      <div className="flex items-center gap-2 border-b border-base-300 bg-base-200 px-3 py-2">
        <button className="btn btn-xs" type="button">
          B
        </button>
        <button className="btn btn-xs" type="button">
          I
        </button>
        <button className="btn btn-xs" type="button">
          H2
        </button>
        <div className="ms-auto join">
          <button className="btn btn-xs join-item btn-primary" type="button">
            Visual
          </button>
          <button className="btn btn-xs join-item btn-outline" type="button">
            HTML
          </button>
        </div>
      </div>
      <textarea
        className="textarea min-h-96 w-full rounded-none border-0 bg-base-100 text-base leading-7 focus:outline-none"
        dir={/[\u0590-\u05ff]/.test(draft.editor.contentHtml) ? "rtl" : "ltr"}
        value={draft.editor.contentHtml}
        onChange={(event) =>
          onUpdate((current) => ({
            ...current,
            editor: { ...current.editor, contentHtml: event.target.value },
          }))
        }
      />
      <label className="form-control border-t border-base-300 p-3">
        <span className="label pb-1 text-xs font-medium text-base-content/60">
          excerpt
        </span>
        <textarea
          className="textarea textarea-bordered min-h-20"
          value={draft.editor.excerpt}
          onChange={(event) =>
            onUpdate((current) => ({
              ...current,
              editor: { ...current.editor, excerpt: event.target.value },
            }))
          }
        />
      </label>
    </section>
  );
}

function ClassicEditorPublishBox({
  canPublish,
  connection,
  draft,
  onCopy,
  onPublish,
  onSave,
  onUpdate,
  publishPending,
  savedState,
}: {
  canPublish: boolean;
  connection:
    | Awaited<ReturnType<typeof getWordPressConnection>>
    | null
    | undefined;
  draft: WordPressClassicPostDraft;
  onCopy: () => void;
  onPublish: () => void;
  onSave: () => void;
  onUpdate: (
    updater: (current: WordPressClassicPostDraft) => WordPressClassicPostDraft,
  ) => void;
  publishPending: boolean;
  savedState: "idle" | "saved";
}) {
  const postTypeLabel = draft.publish.postType === "page" ? "עמוד" : "פוסט";
  const statusLabel = draft.publish.status === "pending" ? "ממתין לאישור" : "טיוטה";
  const targetSite = connection?.siteUrl || "לא הוגדר אתר";
  const targetStatus =
    connection?.lastStatus === "connected"
      ? "מחובר"
      : connection?.lastStatus === "failed"
        ? "נכשל"
        : connection?.hasSharedSecret
          ? "לא נבדק"
          : "לא מחובר";

  return (
    <section className="rounded-md border border-base-300 bg-base-100">
      <div className="border-b border-base-300 px-4 py-3 font-semibold">
        פרסום
      </div>
      <div className="space-y-3 p-4">
        <div>
          <span className="label pb-1 text-xs text-base-content/60">
            יעד פרסום
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`btn btn-sm ${draft.publish.postType === "post" ? "btn-primary" : "btn-outline"}`}
              onClick={() =>
                onUpdate((current) => ({
                  ...current,
                  publish: { ...current.publish, postType: "post" },
                }))
              }
              type="button"
            >
              פוסט
            </button>
            <button
              className={`btn btn-sm ${draft.publish.postType === "page" ? "btn-primary" : "btn-outline"}`}
              onClick={() =>
                onUpdate((current) => ({
                  ...current,
                  publish: { ...current.publish, postType: "page" },
                }))
              }
              type="button"
            >
              עמוד
            </button>
          </div>
        </div>
        <label className="form-control">
          <span className="label pb-1 text-xs text-base-content/60">
            סטטוס יעד
          </span>
          <select
            className="select select-bordered select-sm"
            value={draft.publish.status}
            onChange={(event) =>
              onUpdate((current) => ({
                ...current,
                publish: {
                  ...current.publish,
                  status:
                    event.target.value === "pending" ? "pending" : "draft",
                },
              }))
            }
          >
            <option value="draft">טיוטה</option>
            <option value="pending">ממתין לאישור</option>
          </select>
        </label>
        <label className="form-control">
          <span className="label pb-1 text-xs text-base-content/60">
            תזמון
          </span>
          <input
            className="input input-bordered input-sm"
            type="datetime-local"
            value={draft.publish.scheduledAt ?? ""}
            onChange={(event) =>
              onUpdate((current) => ({
                ...current,
                publish: {
                  ...current.publish,
                  scheduledAt: event.target.value || undefined,
                },
              }))
            }
          />
        </label>
        <div className="rounded-md border border-base-300 bg-base-200 p-3 text-xs leading-5">
          <p className="font-medium text-base-content">סיכום לפני שליחה</p>
          <dl className="mt-2 space-y-1">
            <div className="flex justify-between gap-3">
              <dt className="text-base-content/60">אתר</dt>
              <dd className="max-w-44 truncate text-left" dir="ltr">
                {targetSite}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-base-content/60">חיבור</dt>
              <dd>{targetStatus}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-base-content/60">סוג תוכן</dt>
              <dd>{postTypeLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-base-content/60">סטטוס</dt>
              <dd>{statusLabel}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-base-content/60">Slug</dt>
              <dd className="max-w-44 truncate text-left" dir="ltr">
                {draft.editor.slug}
              </dd>
            </div>
          </dl>
          {draft.publish.postType === "page" ? (
            <p className="mt-2 text-base-content/60">
              עמודים נשלחים ללא קטגוריות ותגיות.
            </p>
          ) : null}
        </div>
        <button className="btn btn-outline btn-sm w-full gap-2" onClick={onSave}>
          {savedState === "saved" ? (
            <Check className="size-4" />
          ) : (
            <Save className="size-4" />
          )}
          {savedState === "saved" ? "נשמר מקומית" : "שמירה מקומית"}
        </button>
        <button
          className="btn btn-primary btn-sm w-full gap-2"
          disabled={!canPublish || publishPending}
          onClick={onPublish}
          type="button"
        >
          {publishPending || draft.sync.lastSyncStatus === "syncing" ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <Send className="size-4" />
          )}
          שלח לוורדפרס
        </button>
        <button
          className="btn btn-outline btn-sm w-full gap-2"
          onClick={onCopy}
          type="button"
        >
          <Clipboard className="size-4" />
          העתק payload
        </button>
        {draft.sync.lastSyncStatus === "synced" ? (
          <div className="rounded-md border border-success/30 bg-success/10 p-3 text-sm">
            <p className="text-success">הטיוטה נשלחה לוורדפרס.</p>
            {draft.sync.editUrl ? (
              <a
                className="mt-2 inline-flex items-center gap-1 text-primary underline"
                href={draft.sync.editUrl}
                rel="noreferrer"
                target="_blank"
              >
                פתח בוורדפרס
                <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
        ) : null}
        {draft.sync.lastSyncStatus === "error" && draft.sync.lastSyncError ? (
          <div className="rounded-md border border-error/30 bg-error/10 p-3 text-sm text-error">
            {draft.sync.lastSyncError}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ClassicEditorPageTargetBox() {
  return (
    <section className="rounded-md border border-base-300 bg-base-100">
      <div className="border-b border-base-300 px-4 py-3 font-semibold">
        הגדרות עמוד
      </div>
      <div className="space-y-2 p-4 text-sm text-base-content/70">
        <p>היעד הנוכחי הוא עמוד WordPress.</p>
        <p>
          קטגוריות ותגיות לא יישלחו. בהמשך ניתן להוסיף בחירת עמוד אב ותבנית.
        </p>
      </div>
    </section>
  );
}

function ClassicEditorTaxonomyBox({
  draft,
  onUpdate,
}: {
  draft: WordPressClassicPostDraft;
  onUpdate: (
    updater: (current: WordPressClassicPostDraft) => WordPressClassicPostDraft,
  ) => void;
}) {
  return (
    <section className="rounded-md border border-base-300 bg-base-100">
      <div className="border-b border-base-300 px-4 py-3 font-semibold">
        קטגוריות ותגיות
      </div>
      <div className="space-y-3 p-4">
        <label className="form-control">
          <span className="label pb-1 text-xs text-base-content/60">
            קטגוריות
          </span>
          <input
            className="input input-bordered input-sm"
            value={joinCsv(draft.taxonomy.categories)}
            onChange={(event) =>
              onUpdate((current) => ({
                ...current,
                taxonomy: {
                  ...current.taxonomy,
                  categories: splitCsv(event.target.value),
                },
              }))
            }
          />
        </label>
        <label className="form-control">
          <span className="label pb-1 text-xs text-base-content/60">
            תגיות
          </span>
          <input
            className="input input-bordered input-sm"
            value={joinCsv(draft.taxonomy.tags)}
            onChange={(event) =>
              onUpdate((current) => ({
                ...current,
                taxonomy: {
                  ...current.taxonomy,
                  tags: splitCsv(event.target.value),
                },
              }))
            }
          />
        </label>
      </div>
    </section>
  );
}

function YoastSeoBox({
  draft,
  onUpdate,
}: {
  draft: WordPressClassicPostDraft;
  onUpdate: (
    updater: (current: WordPressClassicPostDraft) => WordPressClassicPostDraft,
  ) => void;
}) {
  return (
    <section className="rounded-md border border-base-300 bg-base-100 p-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">Yoast SEO</h3>
        <span className="size-2 rounded-full bg-success" />
        <span className="text-xs text-base-content/60">
          Snippet preview ושדות SEO
        </span>
      </div>
      <div className="mt-3 rounded-md border border-info/30 bg-info/10 p-3 text-left" dir="ltr">
        <p className="text-lg leading-snug text-blue-700">{draft.yoast.seoTitle}</p>
        <p className="mt-1 text-xs text-green-700">
          https://example.com/blog/{draft.editor.slug}
        </p>
        <p className="mt-1 text-sm text-base-content/70">
          {draft.yoast.metaDescription || draft.editor.excerpt}
        </p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <YoastInput
          label="Focus keyphrase"
          value={draft.yoast.focusKeyphrase}
          onChange={(value) =>
            onUpdate((current) => ({
              ...current,
              yoast: { ...current.yoast, focusKeyphrase: value },
            }))
          }
        />
        <YoastInput
          label="SEO title"
          value={draft.yoast.seoTitle}
          onChange={(value) =>
            onUpdate((current) => ({
              ...current,
              yoast: { ...current.yoast, seoTitle: value },
            }))
          }
        />
        <YoastInput
          label="Canonical"
          value={draft.yoast.canonical}
          onChange={(value) =>
            onUpdate((current) => ({
              ...current,
              yoast: { ...current.yoast, canonical: value },
            }))
          }
        />
        <YoastInput
          label="Robots"
          placeholder="index,follow"
          value={draft.yoast.robots}
          onChange={(value) =>
            onUpdate((current) => ({
              ...current,
              yoast: { ...current.yoast, robots: value },
            }))
          }
        />
        <label className="form-control md:col-span-2">
          <span className="label pb-1 text-xs text-base-content/60">
            Meta description
          </span>
          <textarea
            className="textarea textarea-bordered min-h-20"
            value={draft.yoast.metaDescription}
            onChange={(event) =>
              onUpdate((current) => ({
                ...current,
                yoast: {
                  ...current.yoast,
                  metaDescription: event.target.value,
                },
              }))
            }
          />
        </label>
      </div>
    </section>
  );
}

function YoastInput({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="form-control">
      <span className="label pb-1 text-xs text-base-content/60">{label}</span>
      <input
        className="input input-bordered"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function PayloadPreview({
  copyState,
  onCopy,
  payload,
}: {
  copyState: "idle" | "copied";
  onCopy: () => void;
  payload: unknown;
}) {
  return (
    <section className="rounded-md border border-base-300 bg-base-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">Payload לתוסף</h3>
        <button className="btn btn-outline btn-sm gap-2" onClick={onCopy}>
          {copyState === "copied" ? (
            <Check className="size-4" />
          ) : (
            <Clipboard className="size-4" />
          )}
          {copyState === "copied" ? "הועתק" : "העתק"}
        </button>
      </div>
      <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-base-100 p-4 text-xs leading-5" dir="ltr">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </section>
  );
}
