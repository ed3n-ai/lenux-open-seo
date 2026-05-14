from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, field_validator


class SiteRequest(BaseModel):
    site_url: HttpUrl


class AuthTestResponse(BaseModel):
    ok: bool
    site_url: str
    service: str
    version: str


class DraftGenerationRequest(BaseModel):
    site_url: HttpUrl
    topic: str = Field(min_length=3, max_length=180)
    audience: str = Field(default="business readers", min_length=2, max_length=120)
    tone: Literal["clear", "expert", "friendly", "persuasive"] = "clear"
    keywords: list[str] = Field(default_factory=list, max_length=8)
    target_words: int = Field(default=500, ge=150, le=1000)

    @field_validator("topic", "audience")
    @classmethod
    def strip_strings(cls, value: str) -> str:
        return value.strip()

    @field_validator("keywords")
    @classmethod
    def normalize_keywords(cls, value: list[str]) -> list[str]:
        normalized: list[str] = []
        seen: set[str] = set()
        for item in value:
            cleaned = item.strip()
            if not cleaned:
                continue
            lowered = cleaned.lower()
            if lowered in seen:
                continue
            seen.add(lowered)
            normalized.append(cleaned)
        return normalized


class DraftResponse(BaseModel):
    title: str
    slug: str
    markdown: str
    html: str
    word_count: int
    keywords: list[str]


class PreparedSeoFields(BaseModel):
    meta_title: str
    meta_description: str
    focus_keyword: str
    canonical: str = ""
    robots: str = ""


class PreparedPostResponse(BaseModel):
    external_id: str
    post_type: Literal["post", "page"] = "post"
    title: str
    slug: str
    excerpt: str
    content_html: str
    content_markdown: str
    status: Literal["draft", "pending"] = "draft"
    categories: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    seo: PreparedSeoFields
    meta: dict[str, str]
