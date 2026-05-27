import { createServerFn } from "@tanstack/react-start";
import { ContentWriterService } from "@/server/features/content/services/ContentWriterService";
import { WordPressBridgeService } from "@/server/features/content/services/WordPressBridgeService";
import { requireProjectContext } from "@/serverFunctions/middleware";
import {
  deleteContentDraftSchema,
  generateContentDraftSchema,
  getContentDraftSchema,
  getContentWriterStatusSchema,
  getWordPressConnectionSchema,
  publishWordPressDraftSchema,
  saveWordPressConnectionSchema,
  testWordPressConnectionSchema,
} from "@/types/schemas/content";

export const getContentWriterStatus = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .inputValidator((data: unknown) => getContentWriterStatusSchema.parse(data))
  .handler(async ({ context }) => {
    const [usage, drafts] = await Promise.all([
      ContentWriterService.getUsageSummary(context.organizationId),
      ContentWriterService.listRecentDrafts(context.projectId),
    ]);

    return { usage, drafts };
  });

export const generateContentDraft = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .inputValidator((data: unknown) => generateContentDraftSchema.parse(data))
  .handler(async ({ context, data }) =>
    ContentWriterService.generateDraft(context, data),
  );

export const getContentDraft = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .inputValidator((data: unknown) => getContentDraftSchema.parse(data))
  .handler(async ({ context, data }) =>
    ContentWriterService.getDraft(context.projectId, data.draftId),
  );

export const deleteContentDraft = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .inputValidator((data: unknown) => deleteContentDraftSchema.parse(data))
  .handler(async ({ context, data }) =>
    ContentWriterService.deleteDraft(context.projectId, data.draftId),
  );

export const getWordPressConnection = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .inputValidator((data: unknown) => getWordPressConnectionSchema.parse(data))
  .handler(async ({ context }) =>
    WordPressBridgeService.getConnection(context.projectId),
  );

export const saveWordPressConnection = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .inputValidator((data: unknown) => saveWordPressConnectionSchema.parse(data))
  .handler(async ({ context, data }) =>
    WordPressBridgeService.saveConnection(context, data),
  );

export const testWordPressConnection = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .inputValidator((data: unknown) => testWordPressConnectionSchema.parse(data))
  .handler(async ({ context }) =>
    WordPressBridgeService.testConnection(context.projectId),
  );

export const publishWordPressDraft = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .inputValidator((data: unknown) => publishWordPressDraftSchema.parse(data))
  .handler(async ({ context, data }) =>
    WordPressBridgeService.publishDraft(context.projectId, data.payload),
  );
