import {
  createProject,
  deleteProject,
  getOrCreateDefaultProject,
  getProject,
  getProjectForOrganization,
  listProjects,
  setProjectWorkflowRole,
} from "@/server/features/projects/services/projects";

export const ProjectService = {
  listProjects,
  createProject,
  deleteProject,
  getOrCreateDefaultProject,
  getProject,
  getProjectForOrganization,
  setProjectWorkflowRole,
} as const;
