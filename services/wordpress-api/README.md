# OpenSEO WordPress FastAPI

Dedicated FastAPI service for a WordPress plugin or any other CMS bridge.

## What it does

- Validates requests with `X-OpenSEO-API-Key`
- Restricts usage to known WordPress site URLs
- Generates content drafts through a dedicated API surface
- Prepares WordPress-friendly payloads with HTML, markdown, slug, and meta

## Endpoints

- `GET /health`
- `POST /v1/auth/test`
- `POST /v1/content/drafts/generate`
- `POST /v1/wordpress/posts/prepare`

## Local run

```bash
cd services/wordpress-api
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
export $(grep -v '^#' .env | xargs)
uvicorn app.main:app --reload --port 8010
```

## Example request

```bash
curl -X POST http://127.0.0.1:8010/v1/content/drafts/generate \
  -H 'Content-Type: application/json' \
  -H 'X-OpenSEO-API-Key: change-me' \
  -d '{
    "site_url": "https://example.com",
    "topic": "technical seo audit for saas",
    "audience": "marketing leaders",
    "tone": "clear",
    "keywords": ["technical seo audit", "saas seo"],
    "target_words": 500
  }'
```
