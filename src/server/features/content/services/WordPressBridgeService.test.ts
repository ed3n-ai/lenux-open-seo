import { beforeEach, describe, expect, test, vi } from "vitest";

const connection = {
  createdAt: "2026-05-20T00:00:00.000Z",
  displayName: "Lenux28 SEO",
  id: "connection-1",
  lastCheckedAt: null,
  lastError: null,
  lastStatus: "unchecked" as const,
  organizationId: "org-1",
  projectId: "project-1",
  sharedSecret: "secret-123",
  siteUrl: "https://example.com",
  updatedAt: "2026-05-20T00:00:00.000Z",
};

const repository = vi.hoisted(() => ({
  getByProject: vi.fn(),
  updateStatus: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/server/features/content/repositories/WordPressConnectionRepository", () => ({
  WordPressConnectionRepository: repository,
}));

describe("WordPressBridgeService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repository.getByProject.mockResolvedValue(connection);
    repository.updateStatus.mockResolvedValue({
      ...connection,
      lastCheckedAt: "2026-05-20T10:00:00.000Z",
      lastStatus: "connected",
    });
  });

  test("normalizes WordPress site URLs to an origin", async () => {
    const { WordPressBridgeService } = await import("./WordPressBridgeService");

    expect(
      WordPressBridgeService.normalizeSiteUrl(
        "example.com/wp-admin/options-general.php?page=openseo-bridge",
      ),
    ).toBe("https://example.com");
    expect(WordPressBridgeService.normalizeSiteUrl("http://example.com/")).toBe(
      "http://example.com",
    );
  });

  test("calls the protected health endpoint with the stored shared secret", async () => {
    const { WordPressBridgeService } = await import("./WordPressBridgeService");
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          product: "Lenux28 SEO",
        }),
        { status: 200 },
      ),
    );

    await WordPressBridgeService.testConnection("project-1", fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      "https://example.com/wp-json/openseo/v1/health",
      {
        headers: {
          "x-openseo-secret": "secret-123",
        },
        method: "GET",
      },
    );
    expect(repository.updateStatus).toHaveBeenCalledWith({
      lastStatus: "connected",
      projectId: "project-1",
    });
  });

  test("publishes a draft to the bridge upsert endpoint", async () => {
    const { WordPressBridgeService } = await import("./WordPressBridgeService");
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          post_id: 42,
          edit_url: "https://example.com/wp-admin/post.php?post=42&action=edit",
        }),
        { status: 200 },
      ),
    );
    const payload = {
      categories: ["SEO"],
      content_html: "<h1>Title</h1>",
      excerpt: "Excerpt",
      external_id: "draft-1",
      post_type: "post" as const,
      scheduled_at: "",
      slug: "title",
      status: "draft" as const,
      tags: ["WordPress"],
      title: "Title",
      yoast: {
        canonical: "",
        focus_keyphrase: "SEO",
        meta_description: "Meta",
        robots: "",
        seo_title: "SEO Title",
      },
    };

    await WordPressBridgeService.publishDraft("project-1", payload, fetcher);

    expect(fetcher).toHaveBeenCalledWith(
      "https://example.com/wp-json/openseo/v1/posts/upsert",
      {
        body: JSON.stringify(payload),
        headers: {
          "content-type": "application/json",
          "x-openseo-secret": "secret-123",
        },
        method: "POST",
      },
    );
  });
});
