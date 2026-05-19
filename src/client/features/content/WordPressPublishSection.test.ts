import { describe, expect, test } from "vitest";
import { markdownishToHtml } from "./WordPressPublishSection";

describe("markdownishToHtml", () => {
  test("escapes quotes and angle brackets inside generated HTML blocks", () => {
    expect(markdownishToHtml('# "SEO" <script>')).toBe(
      "<h1>&quot;SEO&quot; &lt;script&gt;</h1>",
    );
  });

  test("keeps apostrophes readable in paragraph text", () => {
    expect(markdownishToHtml("צ'קליסט לתוכן")).toBe("<p>צ'קליסט לתוכן</p>");
  });

  test("keeps list items outside heading tags", () => {
    expect(
      markdownishToHtml("### כלים מומלצים\n- Google Search Console\n- Ahrefs"),
    ).toBe(
      "<h3>כלים מומלצים</h3>\n<ul><li>Google Search Console</li><li>Ahrefs</li></ul>",
    );
  });

  test("converts markdown tables to html tables", () => {
    expect(
      markdownishToHtml(
        "| קריטריון | משמעות |\n| --- | --- |\n| כוונת חיפוש | סוג התוכן הנכון |",
      ),
    ).toBe(
      "<table><thead><tr><th>קריטריון</th><th>משמעות</th></tr></thead><tbody><tr><td>כוונת חיפוש</td><td>סוג התוכן הנכון</td></tr></tbody></table>",
    );
  });
});
