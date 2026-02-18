import type { MethodologyValue } from "@/lib/constants";

type TerminologyMode = MethodologyValue | "AGILE";

export function useProjectTerminology(methodology?: MethodologyValue | null) {
  const mode: TerminologyMode = (methodology ?? "AGILE") as TerminologyMode;

  const isAgile = mode === "AGILE";
  const isWaterfall = mode === "WATERFALL";
  const isHybrid = mode === "HYBRID";

  const ticketSingular =
    mode === "AGILE" ? "User Story" : mode === "WATERFALL" ? "Task" : "Work Item";
  const ticketPlural =
    mode === "AGILE" ? "User Stories" : mode === "WATERFALL" ? "Tasks" : "Work Items";

  const groupSingular =
    mode === "AGILE" ? "Epic" : mode === "WATERFALL" ? "Phase" : "Phase";
  const groupPlural =
    mode === "AGILE" ? "Epics" : mode === "WATERFALL" ? "Phases / Milestones" : "Phases";

  const timeboxSingular =
    mode === "AGILE" ? "Sprint" : mode === "WATERFALL" ? "Timeline" : "Sprint";
  const timeboxPlural =
    mode === "AGILE" ? "Sprints" : mode === "WATERFALL" ? "Timeline" : "Sprints";

  const effortLabel =
    mode === "AGILE"
      ? "Story Points"
      : mode === "WATERFALL"
        ? "Duration (Hours/Days)"
        : "WSJF / Points";

  const listLabel =
    mode === "AGILE"
      ? "Backlog"
      : mode === "WATERFALL"
        ? "Task List"
        : "Backlog";

  return {
    mode,
    isAgile,
    isWaterfall,
    isHybrid,
    ticketSingular,
    ticketPlural,
    groupSingular,
    groupPlural,
    timeboxSingular,
    timeboxPlural,
    effortLabel,
    listLabel,
  };
}

