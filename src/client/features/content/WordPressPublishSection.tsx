import * as React from "react";
import { Check, Clipboard, Send } from "lucide-react";
import {
  buildPublicationPayload,
  isPostType,
  isPublishStatus,
  type ContentIdea,
  type PublicationPayload,
} from "@/client/features/content/contentManagerStorage";

type PublishForm = Parameters<typeof buildPublicationPayload>[0];

const emptyPublishForm: PublishForm = {
  canonical: "",
  categories: "SEO",
  contentHtml: "",
  excerpt: "",
  focusKeyword: "",
  metaDescription: "",
  metaTitle: "",
  postType: "post",
  robots: "",
  slug: "",
  status: "draft",
  tags: "",
  title: "",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function markdownishToHtml(value: string) {
  const html: string[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let tableRows: string[][] = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    html.push(
      `<p>${escapeHtml(paragraph.join("\n")).replace(/\n/g, "<br />")}</p>`,
    );
    paragraph = [];
  }

  function flushList() {
    if (!listItems.length) return;
    html.push(
      `<ul>${listItems
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>`,
    );
    listItems = [];
  }

  function flushTable() {
    if (tableRows.length < 2) {
      tableRows = [];
      return;
    }

    const [head, ...body] = tableRows;
    html.push(
      [
        "<table>",
        "<thead><tr>",
        ...head.map((cell) => `<th>${escapeHtml(cell)}</th>`),
        "</tr></thead>",
        "<tbody>",
        ...body.map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
        ),
        "</tbody>",
        "</table>",
      ].join(""),
    );
    tableRows = [];
  }

  function parseTableRow(line: string) {
    if (!line.startsWith("|") || !line.endsWith("|")) return null;
    const cells = line
      .slice(1, -1)
      .split("|")
      .map((cell) => cell.trim());
    return cells.length >= 2 ? cells : null;
  }

  function isTableSeparator(cells: string[]) {
    return cells.every((cell) => /^:?-{3,}:?$/.test(cell));
  }

  for (const rawLine of value.split(/\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      flushTable();
      const level = heading[1].length;
      html.push(`<h${level}>${escapeHtml(heading[2])}</h${level}>`);
      continue;
    }

    const tableRow = parseTableRow(line);
    if (tableRow) {
      flushParagraph();
      flushList();
      if (!isTableSeparator(tableRow)) {
        tableRows.push(tableRow);
      }
      continue;
    }

    const listItem = /^[-*]\s+(.+)$/.exec(line);
    if (listItem) {
      flushParagraph();
      flushTable();
      listItems.push(listItem[1]);
      continue;
    }

    flushList();
    flushTable();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();
  flushTable();

  return html.join("\n");
}

export function WordPressPublishSection({
  seed,
}: {
  seed: ContentIdea | null;
}) {
  const [form, setForm] = React.useState<PublishForm>(emptyPublishForm);
  const [payload, setPayload] = React.useState<PublicationPayload | null>(null);
  const [copyState, setCopyState] = React.useState<"idle" | "copied">("idle");

  React.useEffect(() => {
    if (!seed) return;

    setForm((current) => ({
      ...current,
      contentHtml: current.contentHtml || `<h1>${seed.title}</h1>\n<p></p>`,
      excerpt: seed.notes,
      focusKeyword: seed.primaryKeyword,
      metaDescription: seed.notes.slice(0, 155),
      metaTitle: seed.title,
      slug: seed.primaryKeyword,
      tags: seed.secondaryKeywords.join(", "),
      title: seed.title,
    }));
    setPayload(null);
  }, [seed]);

  function update<K extends keyof PublishForm>(key: K, value: PublishForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function copyPayload() {
    if (!payload) return;
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  return (
    <section className="rounded-lg border border-base-300 bg-base-100 p-5">
      <div className="flex items-center gap-2">
        <Send className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">הכנה לפרסום ל-WordPress</h2>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-base-content/70">
        מלאו את פרטי הפרסום ושדות Yoast המרכזיים. התוצאה היא payload מוכן לשליחה
        לנתיב{" "}
        <code className="rounded bg-base-200 px-1 py-0.5 text-xs" dir="ltr">
          POST /wp-json/openseo/v1/posts/upsert
        </code>{" "}
        בתוסף.
      </p>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <PublishFormFields
          form={form}
          onSubmit={() => {
            setPayload(buildPublicationPayload(form));
            setCopyState("idle");
          }}
          onUpdate={update}
        />

        <div className="rounded-lg border border-base-300 bg-base-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Payload לתוסף</h3>
            <button
              type="button"
              className="btn btn-sm btn-outline gap-2"
              disabled={!payload}
              onClick={() => void copyPayload()}
            >
              {copyState === "copied" ? (
                <Check className="size-4" />
              ) : (
                <Clipboard className="size-4" />
              )}
              {copyState === "copied" ? "הועתק" : "העתק"}
            </button>
          </div>
          <pre
            className="mt-3 min-h-96 overflow-auto rounded-lg bg-base-100 p-4 text-xs leading-5"
            dir="ltr"
          >
            {payload
              ? JSON.stringify(payload, null, 2)
              : "ה־payload יופיע כאן אחרי מילוי הטופס."}
          </pre>
        </div>
      </div>
    </section>
  );
}

function PublishFormFields({
  form,
  onSubmit,
  onUpdate,
}: {
  form: PublishForm;
  onSubmit: () => void;
  onUpdate: <K extends keyof PublishForm>(
    key: K,
    value: PublishForm[K],
  ) => void;
}) {
  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <TextInput
        label="כותרת"
        value={form.title}
        onChange={(value) => onUpdate("title", value)}
        wide
      />
      <TextInput
        label="slug"
        value={form.slug}
        onChange={(value) => onUpdate("slug", value)}
      />
      <label className="form-control">
        <span className="label pb-1 text-xs font-medium text-base-content/60">
          יעד
        </span>
        <select
          className="select select-bordered w-full"
          value={form.postType}
          onChange={(event) => {
            if (isPostType(event.target.value)) {
              onUpdate("postType", event.target.value);
            }
          }}
        >
          <option value="post">פוסט</option>
          <option value="page">עמוד</option>
        </select>
      </label>
      <label className="form-control">
        <span className="label pb-1 text-xs font-medium text-base-content/60">
          סטטוס יעד
        </span>
        <select
          className="select select-bordered w-full"
          value={form.status}
          onChange={(event) => {
            if (isPublishStatus(event.target.value)) {
              onUpdate("status", event.target.value);
            }
          }}
        >
          <option value="draft">draft</option>
          <option value="pending">pending</option>
        </select>
      </label>
      <TextInput
        label="קטגוריות"
        value={form.categories}
        onChange={(value) => onUpdate("categories", value)}
      />
      <TextInput
        label="תגיות"
        value={form.tags}
        onChange={(value) => onUpdate("tags", value)}
      />
      <TextArea
        label="תוכן HTML"
        value={form.contentHtml}
        onChange={(value) => onUpdate("contentHtml", markdownishToHtml(value))}
        wide
      />
      <TextArea
        label="excerpt"
        value={form.excerpt}
        onChange={(value) => onUpdate("excerpt", value)}
        wide
      />
      <TextInput
        label="meta title"
        value={form.metaTitle}
        onChange={(value) => onUpdate("metaTitle", value)}
      />
      <TextInput
        label="focus keyword"
        value={form.focusKeyword}
        onChange={(value) => onUpdate("focusKeyword", value)}
      />
      <TextArea
        label="meta description"
        value={form.metaDescription}
        onChange={(value) => onUpdate("metaDescription", value)}
        wide
      />
      <TextInput
        label="canonical"
        value={form.canonical}
        onChange={(value) => onUpdate("canonical", value)}
      />
      <TextInput
        label="robots"
        value={form.robots}
        placeholder="index,follow"
        onChange={(value) => onUpdate("robots", value)}
      />
      <button
        type="submit"
        className="btn btn-primary md:col-span-2"
        disabled={!form.title.trim() || !form.contentHtml.trim()}
      >
        צור payload
      </button>
    </form>
  );
}

function TextInput({
  label,
  onChange,
  placeholder,
  value,
  wide = false,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <label className={`form-control ${wide ? "md:col-span-2" : ""}`}>
      <span className="label pb-1 text-xs font-medium text-base-content/60">
        {label}
      </span>
      <input
        className="input input-bordered w-full"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  onChange,
  value,
  wide = false,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  wide?: boolean;
}) {
  return (
    <label className={`form-control ${wide ? "md:col-span-2" : ""}`}>
      <span className="label pb-1 text-xs font-medium text-base-content/60">
        {label}
      </span>
      <textarea
        className="textarea textarea-bordered"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
