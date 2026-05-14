import { describe, expect, test } from "vitest";
import { generateContentDraftSchema } from "./content";

describe("generateContentDraftSchema", () => {
  test("does not require audience for draft generation", () => {
    const result = generateContentDraftSchema.parse({
      projectId: "project-1",
      topic: "מחקר מילות מפתח",
      language: "he",
      tone: "clear",
      keywords: ["SEO"],
      targetWords: 1000,
    });

    expect(result).not.toHaveProperty("audience");
  });
});
