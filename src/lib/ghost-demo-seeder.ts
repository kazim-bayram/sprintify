import { db } from "@/server/db";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/constants";

const DEMO_SESSION_HOURS = 24;
const PROJECT_KEY = "APPV2";

export type GhostDemoResult = {
  projectId: string;
  projectKey: string;
  demoExpiresAt: Date;
};

/**
 * Ephemeral sandbox: Acme Corp, Mobile App v2.0 (SaaS/Software Launch).
 * NO FMCG/Food references.
 */
export async function seedGhostDemo(userId: string, organizationId: string): Promise<GhostDemoResult> {
  const now = new Date();
  const addDays = (days: number) =>
    new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const demoExpiresAt = addDays(DEMO_SESSION_HOURS);

  return db.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: "Mobile App v2.0 Launch",
        key: PROJECT_KEY,
        description:
          "Acme Corp's SaaS product launch. Hybrid project with phases and sprints.",
        methodology: "HYBRID",
        organizationId,
        isDemo: true,
        demoExpiresAt,
      },
    });

    await tx.boardColumn.createMany({
      data: DEFAULT_BOARD_COLUMNS.map((col) => ({
        name: col.name,
        position: col.position,
        colType: col.colType,
        boardType: col.boardType,
        projectId: project.id,
      })),
    });

    const columns = await tx.boardColumn.findMany({
      where: { projectId: project.id, boardType: "SPRINT_BOARD" },
      orderBy: { position: "asc" },
    });
    const backlogCol = columns.find((c) => c.colType === "BACKLOG") ?? columns[0];
    const todoCol = columns.find((c) => c.colType === "TODO") ?? columns[1];
    const doingCol = columns.find((c) => c.colType === "DOING") ?? columns[2];
    const doneCol = columns.find((c) => c.colType === "DONE") ?? columns[4];

    // Phases (Waterfall)
    const phase1 = await tx.phase.create({
      data: {
        name: "UX Research",
        description: "User research and requirements.",
        color: "#3B82F6",
        position: 0,
        startDate: addDays(-60),
        endDate: addDays(-35),
        progress: 100,
        projectId: project.id,
      },
    });

    const phase2 = await tx.phase.create({
      data: {
        name: "Core Development",
        description: "Implementation and integrations.",
        color: "#F97316",
        position: 1,
        startDate: addDays(-35),
        endDate: addDays(7),
        progress: 65,
        projectId: project.id,
      },
    });

    const phase3 = await tx.phase.create({
      data: {
        name: "Beta Testing",
        description: "QA and release prep.",
        color: "#8B5CF6",
        position: 2,
        startDate: addDays(7),
        endDate: addDays(30),
        progress: 0,
        projectId: project.id,
      },
    });

    // Sprints
    const sprint12 = await tx.sprint.create({
      data: {
        name: "Sprint 12: Auth & DB",
        goal: "Authentication and database foundation.",
        startDate: addDays(-21),
        endDate: addDays(-7),
        status: "CLOSED",
        projectId: project.id,
        phaseId: phase2.id,
        organizationId,
      },
    });

    const sprint13 = await tx.sprint.create({
      data: {
        name: "Sprint 13: UI Polish",
        goal: "UI refinement and integrations.",
        startDate: addDays(-1),
        endDate: addDays(6),
        status: "ACTIVE",
        projectId: project.id,
        phaseId: phase2.id,
        organizationId,
      },
    });

    // Blocked label
    const blockedLabel = await tx.label.create({
      data: {
        name: "Blocked",
        color: "#EF4444",
        organizationId,
      },
    });

    // Ticket 1: Done
    await tx.userStory.create({
      data: {
        number: 1,
        title: "Design System Setup",
        status: "DONE",
        priority: "MEDIUM",
        department: "R_AND_D",
        position: 0,
        storyPoints: 5,
        userBusinessValue: 6,
        timeCriticality: 5,
        riskReduction: 4,
        jobSize: 2,
        projectId: project.id,
        phaseId: phase2.id,
        columnId: doneCol.id,
        sprintId: sprint13.id,
        reporterId: userId,
        organizationId,
      },
    });

    // Ticket 2: In Progress
    await tx.userStory.create({
      data: {
        number: 2,
        title: "Implement OAuth",
        status: "IN_PROGRESS",
        priority: "HIGH",
        department: "R_AND_D",
        position: 1,
        storyPoints: 8,
        userBusinessValue: 8,
        timeCriticality: 7,
        riskReduction: 5,
        jobSize: 3,
        projectId: project.id,
        phaseId: phase2.id,
        columnId: doingCol.id,
        sprintId: sprint13.id,
        reporterId: userId,
        organizationId,
      },
    });

    // Ticket 3: BLOCKED (the hook)
    const blockedStory = await tx.userStory.create({
      data: {
        number: 3,
        title: "Stripe API Integration",
        description:
          "API keys are failing in staging environment. Need DevOps support.",
        status: "IN_PROGRESS",
        priority: "URGENT",
        department: "R_AND_D",
        position: 2,
        storyPoints: 5,
        userBusinessValue: 9,
        timeCriticality: 9,
        riskReduction: 6,
        jobSize: 2,
        projectId: project.id,
        phaseId: phase2.id,
        columnId: doingCol.id,
        sprintId: sprint13.id,
        reporterId: userId,
        organizationId,
      },
    });

    await tx.storyLabel.create({
      data: { storyId: blockedStory.id, labelId: blockedLabel.id },
    });

    // Extra stories for richness
    await tx.userStory.create({
      data: {
        number: 4,
        title: "API documentation",
        status: "TODO",
        priority: "MEDIUM",
        department: "R_AND_D",
        position: 3,
        storyPoints: 3,
        projectId: project.id,
        phaseId: phase2.id,
        columnId: todoCol.id,
        sprintId: sprint13.id,
        reporterId: userId,
        organizationId,
      },
    });

    await tx.userStory.create({
      data: {
        number: 5,
        title: "Performance audit",
        status: "BACKLOG",
        priority: "LOW",
        department: "R_AND_D",
        position: 4,
        storyPoints: 5,
        projectId: project.id,
        phaseId: phase3.id,
        columnId: backlogCol.id,
        reporterId: userId,
        organizationId,
      },
    });

    return {
      projectId: project.id,
      projectKey: project.key,
      demoExpiresAt,
    };
  });
}
