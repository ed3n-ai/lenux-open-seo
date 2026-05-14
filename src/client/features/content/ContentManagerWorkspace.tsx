import * as React from "react";
import { ContentCalendarSection } from "@/client/features/content/ContentCalendarSection";
import { ContentIdeasSection } from "@/client/features/content/ContentIdeasSection";
import {
  addUniqueIdeas,
  createCalendarItem,
  getProjectUserStorageKey,
  parseStoredCalendarItems,
  parseStoredContentIdeas,
  type ContentCalendarItem,
  type ContentIdea,
} from "@/client/features/content/contentManagerStorage";

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getDefaultDueDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function ContentManagerWorkspace({
  projectId,
  userKey,
  onDraftRequest,
}: {
  projectId: string;
  userKey: string;
  onDraftRequest: (idea: ContentIdea) => void;
}) {
  const ideasKey = getProjectUserStorageKey(
    projectId,
    userKey,
    "content-ideas",
  );
  const calendarKey = getProjectUserStorageKey(
    projectId,
    userKey,
    "content-calendar",
  );
  const [savedIdeas, setSavedIdeas] = React.useState<ContentIdea[]>([]);
  const [calendarItems, setCalendarItems] = React.useState<
    ContentCalendarItem[]
  >([]);

  React.useEffect(() => {
    setSavedIdeas(
      parseStoredContentIdeas(window.localStorage.getItem(ideasKey)),
    );
    setCalendarItems(
      parseStoredCalendarItems(window.localStorage.getItem(calendarKey)),
    );
  }, [ideasKey, calendarKey]);

  React.useEffect(() => {
    writeJson(ideasKey, savedIdeas);
  }, [ideasKey, savedIdeas]);

  React.useEffect(() => {
    writeJson(calendarKey, calendarItems);
  }, [calendarKey, calendarItems]);

  function saveIdea(idea: ContentIdea) {
    setSavedIdeas((current) => addUniqueIdeas(current, [idea]));
  }

  function addIdeaToCalendar(idea: ContentIdea) {
    setCalendarItems((current) =>
      addUniqueIdeas(current, [
        createCalendarItem(idea, getDefaultDueDate(current.length + 2)),
      ]),
    );
  }

  function updateCalendarItem(
    id: string,
    patch: Partial<Pick<ContentCalendarItem, "dueDate" | "status">>,
  ) {
    setCalendarItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  return (
    <div className="space-y-6">
      <ContentIdeasSection
        onAddToCalendar={addIdeaToCalendar}
        onSaveIdea={saveIdea}
      />
      <ContentCalendarSection
        items={calendarItems}
        savedIdeas={savedIdeas}
        onAddToCalendar={addIdeaToCalendar}
        onDraftRequest={onDraftRequest}
        onUpdateItem={updateCalendarItem}
      />
    </div>
  );
}
