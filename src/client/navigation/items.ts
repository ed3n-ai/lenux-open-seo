import {
  Bookmark,
  Bot,
  ClipboardCheck,
  FileSearch,
  Globe,
  LayoutDashboard,
  Link2,
  Search,
  TrendingUp,
} from "lucide-react";
import { linkOptions } from "@tanstack/react-router";
import type { ContentWorkflowRole } from "@/client/features/content/contentManagerStorage";

const projectNavItems = [
  {
    to: "/p/$projectId" as const,
    label: "דשבורד",
    icon: LayoutDashboard,
    matchSegment: "/dashboard-root",
    exactMatch: true,
  },
  {
    to: "/p/$projectId/keywords" as const,
    label: "מחקר מילות מפתח",
    icon: Search,
    matchSegment: "/keywords",
    exactMatch: false,
  },
  {
    to: "/p/$projectId/saved" as const,
    label: "מילים שמורות",
    icon: Bookmark,
    matchSegment: "/saved",
    exactMatch: false,
  },
  {
    to: "/p/$projectId/rank-tracking" as const,
    label: "מעקב דירוגים",
    icon: TrendingUp,
    matchSegment: "/rank-tracking",
    exactMatch: false,
  },
  {
    to: "/p/$projectId/domain" as const,
    label: "סקירת דומיין",
    icon: Globe,
    matchSegment: "/domain",
    exactMatch: false,
  },
  {
    to: "/p/$projectId/backlinks" as const,
    label: "קישורים נכנסים",
    icon: Link2,
    matchSegment: "/backlinks",
    exactMatch: false,
  },
  {
    to: "/p/$projectId/audit" as const,
    label: "בדיקת אתר",
    icon: ClipboardCheck,
    matchSegment: "/audit",
    exactMatch: false,
  },
  {
    to: "/p/$projectId/page-intelligence" as const,
    label: "ניתוח עמודים",
    icon: FileSearch,
    matchSegment: "/page-intelligence",
    exactMatch: false,
  },
  {
    to: "/p/$projectId/ai" as const,
    label: "ניהול תוכן",
    icon: Bot,
    matchSegment: "/ai",
    exactMatch: false,
  },
] as const;

function getProjectNavItems(projectId: string) {
  return linkOptions(
    projectNavItems.map((item) => ({
      ...item,
      params: { projectId },
      search: {},
    })),
  );
}

export function getProjectNavGroups(
  projectId: string,
  role?: ContentWorkflowRole | null,
) {
  const all = getProjectNavItems(projectId);
  const bySegment = (seg: string) => all.find((i) => i.matchSegment === seg)!;

  const dashboard = {
    type: "standalone" as const,
    item: bySegment("/dashboard-root"),
  };

  if (role === "content-manager") {
    return [
      dashboard,
      {
        type: "standalone" as const,
        item: bySegment("/page-intelligence"),
      },
      {
        type: "standalone" as const,
        item: bySegment("/ai"),
      },
    ];
  }

  if (role !== "seo-operator") {
    return [dashboard];
  }

  return [
    dashboard,
    {
      type: "group" as const,
      label: "מילות מפתח",
      icon: Search,
      matchSegments: ["/keywords", "/saved", "/rank-tracking"],
      items: [
        bySegment("/keywords"),
        bySegment("/saved"),
        bySegment("/rank-tracking"),
      ],
    },
    {
      type: "group" as const,
      label: "דומיין",
      icon: Globe,
      matchSegments: ["/domain", "/backlinks", "/audit", "/page-intelligence"],
      items: [
        bySegment("/domain"),
        bySegment("/page-intelligence"),
        bySegment("/backlinks"),
        bySegment("/audit"),
      ],
    },
    {
      type: "standalone" as const,
      item: bySegment("/ai"),
    },
  ];
}

export const dataforseoHelpLinkOptions = linkOptions({
  to: "/help/dataforseo-api-key",
});
