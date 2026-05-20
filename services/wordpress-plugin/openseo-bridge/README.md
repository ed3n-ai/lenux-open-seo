# Lenux28 SEO Bridge

Minimal WordPress plugin for connecting Lenux28 SEO to a customer WordPress site.

## Endpoint

`POST /wp-json/openseo/v1/posts/upsert`

Send the shared secret in:

`x-openseo-secret: <secret>`

Health check:

`GET /wp-json/openseo/v1/health`

## Supported MVP fields

- `external_id`
- `post_type`: `post` or `page`
- `title`
- `slug`
- `content_html`
- `excerpt`
- `status`: `draft` or `pending`
- `categories`
- `tags`
- `seo.meta_title`
- `seo.meta_description`
- `seo.focus_keyword`
- `seo.canonical`

The plugin creates or updates a WordPress draft and stores Yoast fields through
the standard Yoast post meta keys.
