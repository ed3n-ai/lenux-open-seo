import { createFileRoute } from "@tanstack/react-router";
import { ClientSandboxPage } from "@/client/features/sandbox/ClientSandboxPage";

export const Route = createFileRoute("/sandbox")({
  component: ClientSandboxPage,
});
