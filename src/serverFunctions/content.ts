import { createServerFn } from "@tanstack/react-start";
import { ContentWriterService } from "@/server/features/content/services/ContentWriterService";
import { requireProjectContext } from "@/serverFunctions/middleware";
import {
  generateContentDraftSchema,
  getContentDraftSchema,
  getContentWriterStatusSchema,
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
