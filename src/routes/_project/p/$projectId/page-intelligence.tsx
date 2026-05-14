import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageIntelligencePage } from "@/client/features/page-intelligence/PageIntelligencePage";
import { isSupportedLocationCode } from "@/client/features/keywords/locations";
import { pageIntelligenceSearchSchema } from "@/types/schemas/page-intelligence";

const DEFAULT_PAGE_INTELLIGENCE_LOCATION = 2376;

export const Route = createFileRoute("/_project/p/$projectId/page-intelligence")({
  validateSearch: pageIntelligenceSearchSchema,
  component: PageIntelligenceRoute,
});

function PageIntelligenceRoute() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate({ from: Route.fullPath });
  const { source = "", loc } = Route.useSearch();
  const locationCode =
    loc != null && isSupportedLocationCode(loc)
      ? loc
      : DEFAULT_PAGE_INTELLIGENCE_LOCATION;

  return (
    <PageIntelligencePage
      projectId={projectId}
      initialSource={source}
      initialLocationCode={locationCode}
      navigate={navigate}
    />
  );
}
