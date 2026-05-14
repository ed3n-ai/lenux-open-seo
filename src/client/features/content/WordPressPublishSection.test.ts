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
});
