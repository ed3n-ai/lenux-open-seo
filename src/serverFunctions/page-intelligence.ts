import { createServerFn } from "@tanstack/react-start";
import { requireProjectContext } from "@/serverFunctions/middleware";
import { PageIntelligenceService } from "@/server/features/page-intelligence/services/PageIntelligenceService";
import { analyzePageIntelligenceSchema } from "@/types/schemas/page-intelligence";

export const analyzePageIntelligence = createServerFn({ method: "POST" })
  .middleware(requireProjectContext)
  .inputValidator((data: unknown) => analyzePageIntelligenceSchema.parse(data))
  .handler(async ({ data, context }) =>
    PageIntelligenceService.analyze(
      {
        ...data,
        projectId: context.projectId,
      },
      context,
    ),
  );
