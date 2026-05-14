# OpenSEO Bridge

Minimal WordPress plugin for the OpenSEO public repository.

## Endpoint

`POST /wp-json/openseo/v1/posts/upsert`

Send the shared secret in:

`x-openseo-secret: <secret>`

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
