import { z } from "zod";

export const projectWorkflowRoleSchema = z.enum([
  "content-manager",
  "seo-operator",
]);

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(120),
  domain: z
    .string()
    .trim()
    .max(255)
    .transform((value) => value || undefined)
    .optional(),
});

export const deleteProjectSchema = z.object({
  projectId: z.string().min(1),
});

export const setProjectWorkflowRoleSchema = z.object({
  projectId: z.string().min(1),
  workflowRole: projectWorkflowRoleSchema,
});

export type ProjectWorkflowRole = z.infer<typeof projectWorkflowRoleSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;
export type SetProjectWorkflowRoleInput = z.infer<
  typeof setProjectWorkflowRoleSchema
>;
