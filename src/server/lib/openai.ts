import { z } from "zod";
import type { GenerateContentDraftInput } from "@/types/schemas/content";
import { AppError } from "@/server/lib/errors";
import { getEnvValue, getRequiredEnvValue } from "@/server/lib/runtime-env";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_CONTENT_MODEL = "gpt-5.2";
const DEFAULT_REASONING_EFFORT = "medium";
const MAX_ERROR_BODY_LENGTH = 1200;
const reasoningEffortSchema = z.enum(["minimal", "low", "medium", "high"]);

const openAIContentDraftSchema = z.object({
  focusKeyphrase: z.string().trim().min(1).max(120),
  markdown: z.string().trim().min(300),
  metaDescription: z.string().trim().min(50).max(180),
  seoTitle: z.string().trim().min(5).max(90),
  title: z.string().trim().min(5).max(180),
});

export type OpenAIContentDraft = z.infer<typeof openAIContentDraftSchema>;

function getToneLabel(tone: GenerateContentDraftInput["tone"]) {
  return {
    clear: "clear, direct, practical",
    expert: "authoritative, specific, evidence-aware",
    friendly: "approachable, simple, useful",
    persuasive: "outcome-focused, objection-aware, conversion-oriented",
  }[tone];
}

function getLanguageLabel(language: GenerateContentDraftInput["language"]) {
  return language === "he" ? "Hebrew" : "English";
}

function buildPrompt(input: GenerateContentDraftInput) {
  const primaryKeyword = input.keywords[0] ?? input.topic;
  const secondaryKeywords = input.keywords.slice(1);

  return [
    `Write a high-quality SEO article draft for a content manager.`,
    `Language: ${getLanguageLabel(input.language)}.`,
    `Topic: ${input.topic}.`,
    `Primary keyword: ${primaryKeyword}.`,
    secondaryKeywords.length
      ? `Secondary keywords: ${secondaryKeywords.join(", ")}.`
      : `Secondary keywords: none provided; infer close semantic terms without keyword stuffing.`,
    `Target length: about ${input.targetWords} words.`,
    `Tone: ${getToneLabel(input.tone)}.`,
    ``,
    `Article requirements:`,
    `- Return publishable Markdown, not notes about the article.`,
    `- Use the following structure as the default SEO publishing method: one H1 only, then a short introduction, then H2 sections mapped to the primary and secondary keyword intent, then H3 subsections for tools, examples, steps, caveats, and FAQ questions.`,
    `- The Markdown must start with exactly one H1 that matches the title. Do not add any other H1 later.`,
    `- Include 4-7 H2 sections and use H3 subsections where a section has multiple practical subtopics.`,
    `- Include at least one Markdown table when comparison, prioritization, checklist, metrics, or decision criteria would help the reader.`,
    `- Include practical examples, common mistakes, FAQ, and a clear summary.`,
    `- Avoid generic filler, repeated paragraphs, and meta commentary about writing.`,
    `- Use the primary keyword naturally in the title, introduction, at least one H2, and summary. Use secondary keywords as section-level concepts, not as a stuffed list.`,
    `- Make the structure suitable for organic ranking: search intent first, topical coverage second, editorial clarity third.`,
    `- Make the draft useful enough that an editor can move directly into a WordPress publishing editor.`,
    input.language === "he"
      ? `- Write fluent professional Hebrew. Keep English SEO terms only where they are natural.`
      : `- Write fluent professional English.`,
  ].join("\n");
}

function getResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === "string") return record.output_text;

  const output = record.output;
  if (!Array.isArray(output)) return "";

  const parts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;

    for (const contentItem of content) {
      if (!contentItem || typeof contentItem !== "object") continue;
      const text = (contentItem as Record<string, unknown>).text;
      if (typeof text === "string") parts.push(text);
    }
  }

  return parts.join("\n").trim();
}

function parseDraftResponse(text: string): OpenAIContentDraft {
  try {
    return openAIContentDraftSchema.parse(JSON.parse(text));
  } catch {
    throw new AppError("CONTENT_AI_GENERATION_FAILED");
  }
}

async function getContentModel() {
  return (await getEnvValue("OPENAI_CONTENT_MODEL")) ?? DEFAULT_CONTENT_MODEL;
}

async function getContentReasoningEffort() {
  const value = await getEnvValue("OPENAI_CONTENT_REASONING_EFFORT");
  return reasoningEffortSchema.catch(DEFAULT_REASONING_EFFORT).parse(value);
}

export async function generateOpenAIContentDraft(
  input: GenerateContentDraftInput,
): Promise<OpenAIContentDraft> {
  let apiKey: string;
  try {
    apiKey = await getRequiredEnvValue("OPENAI_API_KEY");
  } catch {
    throw new AppError("CONTENT_AI_CONFIG_MISSING");
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    body: JSON.stringify({
      input: [
        {
          content:
            "You are an expert SEO content strategist and senior editor. Generate only the requested structured JSON.",
          role: "system",
        },
        {
          content: buildPrompt(input),
          role: "user",
        },
      ],
      max_output_tokens: Math.min(12000, Math.max(6000, input.targetWords * 8)),
      model: await getContentModel(),
      reasoning: {
        effort: await getContentReasoningEffort(),
      },
      text: {
        format: {
          name: "content_draft",
          schema: {
            additionalProperties: false,
            properties: {
              focusKeyphrase: {
                description: "The main SEO keyphrase for Yoast.",
                type: "string",
              },
              markdown: {
                description: "The complete article draft in Markdown.",
                type: "string",
              },
              metaDescription: {
                description: "A concise SEO meta description.",
                type: "string",
              },
              seoTitle: {
                description:
                  "SEO title suitable for a WordPress/Yoast title field.",
                type: "string",
              },
              title: {
                description: "The article title without Markdown markup.",
                type: "string",
              },
            },
            required: [
              "title",
              "markdown",
              "seoTitle",
              "metaDescription",
              "focusKeyphrase",
            ],
            type: "object",
          },
          strict: true,
          type: "json_schema",
        },
      },
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const body = (await response.text()).slice(0, MAX_ERROR_BODY_LENGTH);
    throw new AppError(
      "CONTENT_AI_GENERATION_FAILED",
      body || `OpenAI request failed with status ${response.status}`,
    );
  }

  const payload = await response.json();
  const text = getResponseText(payload);
  if (!text) {
    throw new AppError("CONTENT_AI_GENERATION_FAILED");
  }

  return parseDraftResponse(text);
}
