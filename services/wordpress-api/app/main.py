from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException

from .auth import require_api_key
from .config import get_settings
from .drafts import (
    build_markdown_draft,
    count_words,
    markdown_to_html,
    slugify,
    to_title,
)
from .schemas import (
    AuthTestResponse,
    DraftGenerationRequest,
    DraftResponse,
    PreparedPostResponse,
    PreparedSeoFields,
    SiteRequest,
)

settings = get_settings()

app = FastAPI(
    title="OpenSEO WordPress API",
    version=settings.version,
    docs_url="/docs",
    redoc_url="/redoc",
)


def ensure_allowed_site(site_url: str) -> None:
    if not settings.allowed_sites:
        return

    normalized = site_url.rstrip("/")
    if normalized in settings.allowed_sites:
        return

    raise HTTPException(status_code=403, detail="Site is not allowed")


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.service_name,
        "version": settings.version,
    }


@app.post("/v1/auth/test", response_model=AuthTestResponse)
def auth_test(
    payload: SiteRequest,
    _: None = Depends(require_api_key),
) -> AuthTestResponse:
    ensure_allowed_site(str(payload.site_url))
    return AuthTestResponse(
        ok=True,
        site_url=str(payload.site_url),
        service=settings.service_name,
        version=settings.version,
    )


@app.post("/v1/content/drafts/generate", response_model=DraftResponse)
def generate_draft(
    payload: DraftGenerationRequest,
    _: None = Depends(require_api_key),
) -> DraftResponse:
    ensure_allowed_site(str(payload.site_url))

    markdown = build_markdown_draft(payload)
    title = to_title(payload.topic)

    return DraftResponse(
        title=title,
        slug=slugify(title),
        markdown=markdown,
        html=markdown_to_html(markdown),
        word_count=count_words(markdown),
        keywords=payload.keywords,
    )


@app.post("/v1/wordpress/posts/prepare", response_model=PreparedPostResponse)
def prepare_post(
    payload: DraftGenerationRequest,
    _: None = Depends(require_api_key),
) -> PreparedPostResponse:
    ensure_allowed_site(str(payload.site_url))

    markdown = build_markdown_draft(payload)
    title = to_title(payload.topic)
    html = markdown_to_html(markdown)
    excerpt = (
        f"{payload.topic} for {payload.audience}. "
        "Structured for editorial review and WordPress publishing."
    )
    primary_keyword = payload.keywords[0] if payload.keywords else payload.topic

    return PreparedPostResponse(
        external_id=f"openseo_{slugify(title)}",
        post_type="post",
        title=title,
        slug=slugify(title),
        excerpt=excerpt[:180],
        content_html=html,
        content_markdown=markdown,
        status="draft",
        categories=[],
        tags=payload.keywords[1:],
        seo=PreparedSeoFields(
            meta_title=title[:60],
            meta_description=excerpt[:155],
            focus_keyword=primary_keyword,
        ),
        meta={
            "site_url": str(payload.site_url),
            "primary_keyword": primary_keyword,
            "tone": payload.tone,
        },
    )
