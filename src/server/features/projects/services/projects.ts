import type {
  CreateProjectInput,
  DeleteProjectInput,
  SetProjectWorkflowRoleInput,
} from "@/types/schemas/projects";
import { ProjectRepository } from "@/server/features/projects/repositories/ProjectRepository";
import { AppError } from "@/server/lib/errors";

function mapProject(project: {
  id: string;
  name: string;
  domain: string | null;
  workflowRole: "content-manager" | "seo-operator" | null;
  createdAt: string;
}) {
  return {
    id: project.id,
    name: project.name,
    domain: project.domain,
    workflowRole: project.workflowRole,
    createdAt: project.createdAt,
  };
}

export async function listProjects(organizationId: string) {
  const rows = await ProjectRepository.listProjects(organizationId);
  return rows.map(mapProject);
}

export async function createProject(
  organizationId: string,
  input: CreateProjectInput,
) {
  const id = await ProjectRepository.createProject(
    organizationId,
    input.name,
    input.domain,
  );
  return { id };
}

export async function deleteProject(
  organizationId: string,
  input: DeleteProjectInput,
) {
  await ProjectRepository.deleteProject(input.projectId, organizationId);
  return { success: true };
}

export async function setProjectWorkflowRole(
  organizationId: string,
  input: SetProjectWorkflowRoleInput,
) {
  const project = await ProjectRepository.getProjectForOrganization(
    input.projectId,
    organizationId,
  );

  if (!project) {
    throw new AppError("NOT_FOUND");
  }

  if (project.workflowRole && project.workflowRole !== input.workflowRole) {
    throw new AppError(
      "CONFLICT",
      "Project workflow role can only be changed by support.",
    );
  }

  if (!project.workflowRole) {
    await ProjectRepository.setWorkflowRole(
      input.projectId,
      organizationId,
      input.workflowRole,
    );
  }

  return {
    ...mapProject(project),
    workflowRole: input.workflowRole,
  };
}

export async function getOrCreateDefaultProject(organizationId: string) {
  const existing = await ProjectRepository.listProjects(organizationId);
  if (existing.length > 0) {
    return mapProject(existing[0]);
  }

  const id = await ProjectRepository.createProject(
    organizationId,
    "Default",
    undefined,
  );

  return {
    id,
    name: "Default",
    domain: null,
    workflowRole: null,
    createdAt: new Date().toISOString(),
  };
}

export async function getProject(projectId: string) {
  const project = await ProjectRepository.getProjectById(projectId);
  if (!project) {
    throw new AppError("NOT_FOUND");
  }

  return mapProject(project);
}

export async function getProjectForOrganization(
  organizationId: string,
  projectId: string,
) {
  const project = await ProjectRepository.getProjectForOrganization(
    projectId,
    organizationId,
  );
  if (!project) {
    throw new AppError("NOT_FOUND");
  }

  return mapProject(project);
}
