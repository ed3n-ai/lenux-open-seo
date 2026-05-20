import type { EnsuredUserContext } from "@/middleware/ensure-user/types";
import { AppError } from "@/server/lib/errors";
import { WordPressConnectionRepository } from "@/server/features/content/repositories/WordPressConnectionRepository";
import type {
  SaveWordPressConnectionInput,
  WordPressBridgePayload,
} from "@/types/schemas/content";

type ProjectContext = EnsuredUserContext & {
  projectId: string;
};

type BridgeConnection = NonNullable<
  Awaited<ReturnType<typeof WordPressConnectionRepository.getByProject>>
>;

type BridgeFetch = typeof fetch;
type BridgeJson = Record<string, string | number | boolean | null>;

const DEFAULT_DISPLAY_NAME = "Lenux28 SEO";
const HEALTH_PATH = "/wp-json/openseo/v1/health";
const UPSERT_PATH = "/wp-json/openseo/v1/posts/upsert";

function normalizeSiteUrl(value: string) {
  try {
    const raw = value.trim();
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Unsupported protocol");
    }
    return url.origin.replace(/\/+$/, "");
  } catch {
    throw new AppError(
      "VALIDATION_ERROR",
      "WordPress site URL must be a valid HTTP or HTTPS URL.",
    );
  }
}

function bridgeUrl(siteUrl: string, path: string) {
  return `${normalizeSiteUrl(siteUrl)}${path}`;
}

function publicConnection(connection: BridgeConnection | null | undefined) {
  if (!connection) return null;

  return {
    displayName: connection.displayName,
    hasSharedSecret: connection.sharedSecret.trim() !== "",
    id: connection.id,
    lastCheckedAt: connection.lastCheckedAt,
    lastError: connection.lastError,
    lastStatus: connection.lastStatus,
    siteUrl: connection.siteUrl,
  };
}

async function getConnection(projectId: string) {
  return publicConnection(
    await WordPressConnectionRepository.getByProject(projectId),
  );
}

async function saveConnection(
  context: ProjectContext,
  input: SaveWordPressConnectionInput,
) {
  const existing = await WordPressConnectionRepository.getByProject(
    context.projectId,
  );
  const sharedSecret = input.sharedSecret?.trim() || existing?.sharedSecret || "";
  if (sharedSecret.length < 8) {
    throw new AppError(
      "VALIDATION_ERROR",
      "WordPress shared secret must be at least 8 characters.",
    );
  }

  const connection = await WordPressConnectionRepository.upsert({
    displayName: input.displayName.trim() || DEFAULT_DISPLAY_NAME,
    id: existing?.id ?? crypto.randomUUID(),
    organizationId: context.organizationId,
    projectId: context.projectId,
    sharedSecret,
    siteUrl: normalizeSiteUrl(input.siteUrl),
  });

  return publicConnection(connection);
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function serializableRecord(value: unknown): BridgeJson {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: BridgeJson = {};
  for (const [key, item] of Object.entries(value)) {
    if (
      typeof item === "string" ||
      typeof item === "number" ||
      typeof item === "boolean" ||
      item === null
    ) {
      result[key] = item;
    }
  }
  return result;
}

function errorMessageFromPayload(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

async function requireConnection(projectId: string) {
  const connection = await WordPressConnectionRepository.getByProject(projectId);
  if (!connection) {
    throw new AppError("NOT_FOUND", "WordPress connection is not configured.");
  }
  return connection;
}

async function testConnection(projectId: string, fetcher: BridgeFetch = fetch) {
  const connection = await requireConnection(projectId);
  try {
    const response = await fetcher(bridgeUrl(connection.siteUrl, HEALTH_PATH), {
      headers: {
        "x-openseo-secret": connection.sharedSecret,
      },
      method: "GET",
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) {
      const message = errorMessageFromPayload(
        payload,
        `WordPress health check failed with HTTP ${response.status}.`,
      );
      await WordPressConnectionRepository.updateStatus({
        lastError: message,
        lastStatus: "failed",
        projectId,
      });
      throw new AppError("VALIDATION_ERROR", message);
    }

      return {
        connection: publicConnection(
          await WordPressConnectionRepository.updateStatus({
            lastStatus: "connected",
            projectId,
          }),
        ),
      health: serializableRecord(payload),
      ok: true,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    const message =
      error instanceof Error ? error.message : "WordPress health check failed.";
    await WordPressConnectionRepository.updateStatus({
      lastError: message,
      lastStatus: "failed",
      projectId,
    });
    throw new AppError("VALIDATION_ERROR", message);
  }
}

async function publishDraft(
  projectId: string,
  payload: WordPressBridgePayload,
  fetcher: BridgeFetch = fetch,
) {
  const connection = await requireConnection(projectId);
  const response = await fetcher(bridgeUrl(connection.siteUrl, UPSERT_PATH), {
    body: JSON.stringify(payload),
    headers: {
      "content-type": "application/json",
      "x-openseo-secret": connection.sharedSecret,
    },
    method: "POST",
  });
  const result = await readJsonResponse(response);
  if (!response.ok) {
    throw new AppError(
      "VALIDATION_ERROR",
      errorMessageFromPayload(
        result,
        `WordPress publish failed with HTTP ${response.status}.`,
      ),
    );
  }

  return serializableRecord(result);
}

export const WordPressBridgeService = {
  getConnection,
  normalizeSiteUrl,
  publishDraft,
  saveConnection,
  testConnection,
} as const;
