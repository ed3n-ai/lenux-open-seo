import { createServerFn } from "@tanstack/react-start";
import { ProjectService } from "@/server/features/projects/services/ProjectService";
import { requireAuthenticatedContext } from "@/serverFunctions/middleware";
import { setProjectWorkflowRoleSchema } from "@/types/schemas/projects";
import { z } from "zod";

export const getOrCreateDefaultProject = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .handler(async ({ context }) =>
    ProjectService.getOrCreateDefaultProject(context.organizationId),
  );

export const getProjectAccess = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .inputValidator((data: unknown) =>
    z.object({ projectId: z.string().min(1) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    return ProjectService.getProjectForOrganization(
      context.organizationId,
      data.projectId,
    );
  });

export const setProjectWorkflowRole = createServerFn({ method: "POST" })
  .middleware(requireAuthenticatedContext)
  .inputValidator((data: unknown) => setProjectWorkflowRoleSchema.parse(data))
  .handler(async ({ data, context }) => {
    return ProjectService.setProjectWorkflowRole(context.organizationId, data);
  });
