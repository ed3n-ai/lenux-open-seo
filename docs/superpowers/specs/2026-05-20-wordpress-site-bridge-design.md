# WordPress Site Bridge Design

## Goal

Build a first production-ready integration path between Lenux28 SEO and customer WordPress sites. The integration must work at the site level through an installable WordPress plugin, not through a private WordPress user account.

The temporary product-facing display name is `Lenux28 SEO`. Existing technical namespaces may remain `openseo` for compatibility during this phase.

## MVP Scope

- A customer installs the WordPress bridge plugin in wp-admin.
- The plugin exposes a secured REST endpoint for receiving prepared drafts.
- The plugin settings page shows the endpoint and shared secret.
- Lenux28 SEO stores a WordPress site connection per project.
- A user can test the connection from Lenux28 SEO.
- A user can send a prepared publishing-editor draft to the connected WordPress site.
- The plugin creates or updates a WordPress draft by `external_id`.
- The plugin saves title, slug, HTML content, excerpt, status, post type, categories, tags, and Yoast fields.
- The plugin returns `post_id`, status, and the WordPress edit URL.

## Out Of Scope

- OAuth or automatic pairing flow.
- Publishing directly as `publish`.
- Two-way sync from WordPress back to Lenux28 SEO.
- Featured image upload.
- Media library management.
- RankMath or other SEO plugin adapters.
- Full product rebrand of internal code namespaces.

## Architecture

The first integration uses a simple site bridge:

1. WordPress plugin receives requests at `/wp-json/openseo/v1/posts/upsert`.
2. Requests must include `x-openseo-secret`.
3. Lenux28 SEO stores the customer site URL and secret in a project-level connection.
4. The publishing editor maps the local draft into the plugin payload and sends it through a server function.
5. The server function calls the customer WordPress endpoint and returns the result to the UI.

The plugin is responsible for WordPress-specific mapping. Lenux28 SEO is responsible for editorial preparation, payload construction, and user-facing connection management.

## WordPress Plugin

The plugin display name should be `Lenux28 SEO Bridge`.

The plugin keeps the current class/file structure for now:

- `openseo-bridge.php`
- `includes/class-openseo-auth.php`
- `includes/class-openseo-rest.php`
- `includes/class-openseo-post-mapper.php`
- `includes/class-openseo-yoast-adapter.php`
- `includes/class-openseo-settings.php`

The REST namespace remains `openseo/v1` for this phase to avoid breaking the existing contract. Labels shown to the WordPress admin should use `Lenux28 SEO`.

## OpenSEO / Lenux28 SEO App

Add a project-level WordPress connection model:

- display name
- site URL
- shared secret
- last connection status
- last checked timestamp

For the MVP, one connection per project is enough. The UI can later expand to multiple sites.

## Data Flow

1. User installs the plugin on the customer WordPress site.
2. User opens the plugin settings page and copies the endpoint and secret.
3. User adds the WordPress site connection in Lenux28 SEO.
4. User runs a connection test.
5. User opens a content draft in the publishing editor.
6. User clicks send to WordPress.
7. Lenux28 SEO sends the mapped payload to the bridge plugin.
8. WordPress creates or updates the draft.
9. Lenux28 SEO shows the returned edit URL.

## Error Handling

- Missing site URL or secret: block connection save and show inline validation.
- Failed health check: store failed status and show the HTTP/error message.
- Invalid secret: return a clear authentication failure.
- WordPress insert/update failure: return the WordPress error code and message.
- Network timeout: show a retryable error.

## Testing

- Unit test payload mapping from publishing-editor draft to WordPress bridge payload.
- Unit test URL normalization for customer site URLs.
- Unit test server-side connection validation.
- Add plugin-level PHP smoke tests later if a WordPress test harness is introduced.
- Manually verify against a local WordPress site before production rollout.

