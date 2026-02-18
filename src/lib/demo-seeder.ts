import { db } from "@/server/db";
import { DEFAULT_BOARD_COLUMNS, DEFAULT_DOD_ITEMS, DEFAULT_DOR_ITEMS, generateJoinCode } from "@/lib/constants";

const DEMO_SESSION_HOURS = 24;
const MAX_PHASES = 4;
const MAX_SPRINTS = 2;
const MAX_TASKS = 25;
const DEMO_PROJECT_KEY = "APPV2";

type SeedResult = {
  projectId: string;
  projectKey: string;
  demoExpiresAt: Date | null;
};

/**
 * Narrative: "Mobile App Launch v2" (Hybrid).
 * The project is delayed due to a vendor integration issue. Hook: a critical task in IN_PROGRESS
 * invites the user to switch to Timeline View to reschedule dependencies.
 * Volume: exactly 4 phases, 2 sprints, 25 tasks total.
 */
export async function seedDemoData(userId: string): Promise<SeedResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: { organization: true },
      },
    },
  });

  if (!user) {
    throw new Error("Demo seeder: user not found");
  }

  let organization = user.memberships[0]?.organization;

  if (!organization) {
    const baseSlug = `demo-${user.id.slice(0, 8).toLowerCase()}`;
    let slug = baseSlug;
    let counter = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await db.organization.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${counter++}`;
    }

    organization = await db.organization.create({
      data: {
        name: "Demo Workspace",
        slug,
        joinCode: generateJoinCode("DEMO"),
      },
    });

    await db.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "ADMIN",
      },
    });
  }

  const existingProject = await db.project.findFirst({
    where: { organizationId: organization.id, key: DEMO_PROJECT_KEY },
  });

  if (existingProject) {
    return {
      projectId: existingProject.id,
      projectKey: existingProject.key,
      demoExpiresAt: existingProject.demoExpiresAt,
    };
  }

  const now = new Date();
  const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const demoExpiresAt = new Date(now.getTime() + DEMO_SESSION_HOURS * 60 * 60 * 1000);

  return db.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: "Mobile App Launch v2",
        key: DEMO_PROJECT_KEY,
        description:
          "A hybrid project to manage timelines, sprints, and dependencies in one place. The project is delayed due to a vendor integration issue—use the Timeline to see impact and reschedule.",
        methodology: "HYBRID",
        organizationId: organization.id,
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

    const sprintColumns = await tx.boardColumn.findMany({
      where: { projectId: project.id, boardType: "SPRINT_BOARD" },
      orderBy: { position: "asc" },
    });

    const backlogColumn = sprintColumns.find((c) => c.colType === "BACKLOG") ?? sprintColumns[0];
    const todoColumn = sprintColumns.find((c) => c.colType === "TODO") ?? sprintColumns[0];
    const inProgressColumn = sprintColumns.find((c) => c.colType === "DOING") ?? sprintColumns[0];

    // ——— 4 Phases (Waterfall) ———
    const phase1 = await tx.phase.create({
      data: {
        name: "Discovery & Planning",
        description: "Scope, requirements, and stakeholder alignment.",
        color: "#3B82F6",
        position: 0,
        startDate: addDays(-75),
        endDate: addDays(-45),
        progress: 100,
        projectId: project.id,
      },
    });

    const phase2 = await tx.phase.create({
      data: {
        name: "Design & Build",
        description: "Implementation, UI/UX, and core integrations.",
        color: "#F97316",
        position: 1,
        startDate: addDays(-45),
        endDate: addDays(-14),
        progress: 65,
        projectId: project.id,
      },
    });

    const phase3 = await tx.phase.create({
      data: {
        name: "Testing & Launch Prep",
        description: "QA, performance checks, and release readiness.",
        color: "#8B5CF6",
        position: 2,
        startDate: addDays(-14),
        endDate: addDays(14),
        progress: 20,
        projectId: project.id,
      },
    });

    const phase4 = await tx.phase.create({
      data: {
        name: "Release & Rollout",
        description: "Release, monitoring, and post-launch follow-ups.",
        color: "#22C55E",
        position: 3,
        startDate: addDays(14),
        endDate: addDays(60),
        progress: 0,
        projectId: project.id,
      },
    });

    // ——— 2 Sprints (Agile) ———
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const sprint1 = await tx.sprint.create({
      data: {
        name: "Sprint 1 — Foundations",
        goal: "Finalize requirements and ship core scaffolding.",
        startDate: addDays(-28),
        endDate: addDays(-14),
        status: "CLOSED",
        projectId: project.id,
        phaseId: phase2.id,
        organizationId: organization.id,
      },
    });

    const sprint2 = await tx.sprint.create({
      data: {
        name: "Sprint 2 — Release Prep",
        goal: "Unblock integration work and prepare for release.",
        startDate: startOfWeek,
        endDate: endOfWeek,
        status: "ACTIVE",
        projectId: project.id,
        phaseId: phase2.id,
        organizationId: organization.id,
      },
    });

    // ——— Hook story: "⚠️ CRITICAL: Vendor Integration Delay" (IN_PROGRESS) ———
    const hookStory = await tx.userStory.create({
      data: {
        number: 1,
        title: "⚠️ CRITICAL: Vendor Integration Delay",
        description:
          "Our primary vendor has slipped their delivery by 2 weeks. We need to switch to the backup option or the release timeline will slip.",
        status: "IN_PROGRESS",
        priority: "URGENT",
        department: "R_AND_D",
        position: 0,
        storyPoints: 5,
        userBusinessValue: 9,
        timeCriticality: 9,
        riskReduction: 5,
        jobSize: 2,
        projectId: project.id,
        phaseId: phase2.id,
        columnId: inProgressColumn.id,
        sprintId: sprint2.id,
        reporterId: user.id,
        organizationId: organization.id,
      },
    });

    await tx.task.create({
      data: {
        title: "Evaluate backup vendor option",
        completed: false,
        position: 0,
        storyId: hookStory.id,
      },
    });
    await tx.comment.create({
      data: {
        body: "We need to switch to the backup vendor or the release will be delayed by 2 weeks.",
        storyId: hookStory.id,
        userId: user.id,
      },
    });

    // Remaining stories and tasks to reach 25 tasks total (1 already created = 24 more)
    const storiesData: Array<{
      title: string;
      phaseId: string;
      sprintId: string | null;
      columnId: string;
      status: string;
      taskTitles: string[];
    }> = [
      {
        title: "Finalize requirements sign-off",
        phaseId: phase1.id,
        sprintId: null,
        columnId: backlogColumn.id,
        status: "DONE",
        taskTitles: ["Review scope", "Stakeholder sign-off"],
      },
      {
        title: "Confirm vendor contract and SLA",
        phaseId: phase2.id,
        sprintId: sprint1.id,
        columnId: todoColumn.id,
        status: "TODO",
        taskTitles: ["Negotiate terms", "Sign contract", "Confirm timeline", "Update tracker"],
      },
      {
        title: "Build MVP milestone",
        phaseId: phase3.id,
        sprintId: sprint2.id,
        columnId: todoColumn.id,
        status: "TODO",
        taskTitles: ["Implement core flow", "Integrate API", "QA pass", "Performance check", "Documentation"],
      },
      {
        title: "Design system approval",
        phaseId: phase3.id,
        sprintId: sprint2.id,
        columnId: inProgressColumn.id,
        status: "IN_PROGRESS",
        taskTitles: ["Homepage layout", "Stakeholder review", "Accessibility pass"],
      },
      {
        title: "Release notes and help center updates",
        phaseId: phase3.id,
        sprintId: sprint2.id,
        columnId: todoColumn.id,
        status: "TODO",
        taskTitles: ["Draft notes", "Review", "Publish"],
      },
      {
        title: "Go-live checklist",
        phaseId: phase4.id,
        sprintId: null,
        columnId: backlogColumn.id,
        status: "BACKLOG",
        taskTitles: ["Monitoring", "Rollback plan", "Runbook"],
      },
      {
        title: "Stakeholder comms",
        phaseId: phase4.id,
        sprintId: null,
        columnId: backlogColumn.id,
        status: "BACKLOG",
        taskTitles: ["Announcement draft", "Internal email", "Customer update", "FAQ page"],
      },
    ];

    let storyNumber = 2;
    let totalTasks = 1;

    for (const s of storiesData) {
      if (totalTasks >= MAX_TASKS) break;

      const story = await tx.userStory.create({
        data: {
          number: storyNumber++,
          title: s.title,
          status: s.status,
          priority: "MEDIUM",
          department: "R_AND_D",
          position: storyNumber - 2,
          storyPoints: 3,
          userBusinessValue: 5,
          timeCriticality: 4,
          riskReduction: 3,
          jobSize: 1,
          projectId: project.id,
          phaseId: s.phaseId,
          columnId: s.columnId,
          sprintId: s.sprintId,
          reporterId: user.id,
          organizationId: organization.id,
        },
      });

      for (let i = 0; i < s.taskTitles.length && totalTasks < MAX_TASKS; i++) {
        await tx.task.create({
          data: {
            title: s.taskTitles[i],
            completed: s.status === "DONE",
            position: i,
            storyId: story.id,
          },
        });
        totalTasks++;
      }
    }

    // DoR on one backlog story
    const backlogStory = await tx.userStory.findFirst({
      where: { projectId: project.id, columnId: backlogColumn.id },
    });
    if (backlogStory) {
      const dorItems = DEFAULT_DOR_ITEMS.length ? DEFAULT_DOR_ITEMS : ["Brief approved", "Dependencies identified"];
      await Promise.all(
        dorItems.map((title, index) =>
          tx.checklistItem.create({
            data: { title, type: "DOR", position: index, checked: false, storyId: backlogStory.id },
          })
        )
      );
    }

    // DoD on hook story
    await Promise.all(
      DEFAULT_DOD_ITEMS.slice(0, 2).map((title, index) =>
        tx.checklistItem.create({
          data: { title, type: "DOD", position: index, checked: index === 0, storyId: hookStory.id },
        })
      )
    );

    return {
      projectId: project.id,
      projectKey: project.key,
      demoExpiresAt,
    };
  });
}
