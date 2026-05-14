from __future__ import annotations

import html
import re

from .schemas import DraftGenerationRequest


def count_words(text: str) -> int:
    return len(re.findall(r"\S+", text.strip()))


def trim_to_word_limit(text: str, limit: int) -> str:
    words = re.findall(r"\S+", text.strip())
    if len(words) <= limit:
        return text.strip()
    return f"{' '.join(words[:limit])}."


def to_title(topic: str) -> str:
    return " ".join(word[:1].upper() + word[1:] for word in topic.split() if word)


def get_tone_direction(tone: str) -> str:
    directions = {
        "clear": "The tone is direct, practical, and easy to scan.",
        "expert": "The tone is authoritative, with specific reasoning and confident recommendations.",
        "friendly": "The tone is approachable, encouraging, and simple without becoming shallow.",
        "persuasive": "The tone focuses on outcomes, objections, and a clear reason to act.",
    }
    return directions[tone]


def get_primary_keyword(payload: DraftGenerationRequest) -> str:
    return payload.keywords[0] if payload.keywords else payload.topic


def build_keyword_guidance(keywords: list[str]) -> str:
    if not keywords:
        return (
            "Use the main topic naturally in the title, introduction, one H2, "
            "and the conclusion. Add related terms during editorial review."
        )

    primary, *secondary = keywords
    if not secondary:
        return (
            f"Primary keyword: {primary}. Use it in the title, introduction, "
            "one H2, and conclusion without forcing repetition."
        )

    return (
        f"Primary keyword: {primary}. Secondary terms: {', '.join(secondary)}. "
        "Use them as section-level context, not as a repeated checklist."
    )


def build_reader_promise(payload: DraftGenerationRequest) -> str:
    return (
        f"By the end, {payload.audience} should understand what {payload.topic} "
        "means, why it matters, how to evaluate options, and what to do next."
    )


def build_faq(payload: DraftGenerationRequest) -> list[str]:
    primary_keyword = get_primary_keyword(payload)
    return [
        "## FAQ",
        f"### What is the most important thing to know about {primary_keyword}?",
        (
            f"The most important thing is to connect {primary_keyword} to a real decision. "
            f"A good article should not only define {primary_keyword}; it should help "
            "the reader understand tradeoffs, avoid common mistakes, and choose a next step."
        ),
        f"### How should {payload.audience} get started?",
        (
            "Start with one focused use case. Gather the current baseline, define the "
            "outcome you want, and document what success would look like."
        ),
    ]


def build_body_sections(payload: DraftGenerationRequest) -> list[str]:
    primary_keyword = get_primary_keyword(payload)
    keyword_guidance = build_keyword_guidance(payload.keywords)
    reader_promise = build_reader_promise(payload)

    return [
        f"## Why {primary_keyword} matters",
        (
            f"{payload.topic} matters because readers usually arrive with a specific "
            f"problem, not casual curiosity. {reader_promise}"
        ),
        (
            "A strong article should make the decision feel easier. Explain context, "
            "show the criteria that matter, and make the next action obvious."
        ),
        "## What to know before you start",
        (
            "Before taking action, define the current state. What is working now, "
            "what is underperforming, and which constraint matters most?"
        ),
        keyword_guidance,
        "## A practical framework",
        (
            "Use a simple framework: diagnose the problem, prioritize the highest-impact "
            "opportunity, execute one focused improvement, then measure the result."
        ),
        (
            f"For {payload.audience}, the best framework is usually the one that creates "
            "momentum quickly and keeps scope under control."
        ),
        "## Common mistakes to avoid",
        (
            "The first mistake is writing for everyone. The second is relying on "
            "buzzwords instead of evidence. The third is ending without a concrete next step."
        ),
        (
            "Keywords help with discoverability, but trust comes from examples, "
            "comparisons, and guidance the reader can actually use."
        ),
        "## Recommended next step",
        (
            "Turn this topic into a publishable page by adding product examples, "
            "internal links, screenshots, or real data from your workflow."
        ),
    ]


def build_markdown_draft(payload: DraftGenerationRequest) -> str:
    title = to_title(payload.topic)
    sections = [
        f"# {title}",
        (
            f"This article is written for {payload.audience}. It explains {payload.topic} "
            "with a clear point of view, practical structure, and enough detail for "
            f"an editor to turn it into a publishable article. {get_tone_direction(payload.tone)}"
        ),
        *build_body_sections(payload),
        *build_faq(payload),
        "## Conclusion",
        (
            f"{payload.topic} is most valuable when it helps the reader make a better decision. "
            "Keep the article focused on the reader's situation, explain tradeoffs plainly, "
            "and end with a next step that is specific enough to act on."
        ),
    ]

    return trim_to_word_limit("\n\n".join(sections), payload.target_words)


def markdown_to_html(markdown_text: str) -> str:
    blocks = [block.strip() for block in markdown_text.split("\n\n") if block.strip()]
    html_blocks: list[str] = []

    for block in blocks:
        escaped = html.escape(block)
        if escaped.startswith("### "):
            html_blocks.append(f"<h3>{escaped[4:]}</h3>")
        elif escaped.startswith("## "):
            html_blocks.append(f"<h2>{escaped[3:]}</h2>")
        elif escaped.startswith("# "):
            html_blocks.append(f"<h1>{escaped[2:]}</h1>")
        else:
            paragraph = escaped.replace("\n", "<br />")
            html_blocks.append(f"<p>{paragraph}</p>")

    return "\n".join(html_blocks)


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return slug or "draft"
