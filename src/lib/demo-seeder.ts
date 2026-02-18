import { db } from "@/server/db";
import { DEFAULT_BOARD_COLUMNS, DEFAULT_DOD_ITEMS, DEFAULT_DOR_ITEMS, generateJoinCode } from "@/lib/constants";

type SeedResult = {
  projectId: string;
  projectKey: string;
};

/** Seed a rich hybrid demo project for the given app user. Idempotent per organization. */
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

  // Reuse first organization if it exists, otherwise create a dedicated demo org
  let organization = user.memberships[0]?.organization;

  if (!organization) {
    const baseSlug = `demo-${user.id.slice(0, 8).toLowerCase()}`;
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug uniqueness
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await db.organization.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${counter++}`;
    }

    organization = await db.organization.create({
      data: {
        name: "Project Velvet Demo Org",
        slug,
        joinCode: generateJoinCode("VELVET"),
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

  // Idempotency: if Project Velvet already exists for this org, reuse it
  const existingProject = await db.project.findFirst({
    where: { organizationId: organization.id, key: "VELVET" },
  });

  if (existingProject) {
    return { projectId: existingProject.id, projectKey: existingProject.key };
  }

  const now = new Date();
  const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return db.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: "Project Velvet - Hydra-Boost Shampoo",
        key: "VELVET",
        description:
          "Hybrid Stage-Gate + Agile project to launch a new sulfate-free, hydrating shampoo under the Project Velvet line.",
        methodology: "HYBRID",
        organizationId: organization.id,
      },
    });

    // Board columns (sprint + global backlog)
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

    // Phases (Waterfall timeline)
    const phases = await Promise.all([
      tx.phase.create({
        data: {
          name: "Market Research & Concept",
          description: "Consumer insights, positioning, and concept testing for the new Hydra-Boost shampoo.",
          color: "#3B82F6", // Blue
          position: 0,
          startDate: addDays(-90),
          endDate: addDays(-60),
          progress: 100,
          projectId: project.id,
        },
      }),
      tx.phase.create({
        data: {
          name: "Formula Development",
          description: "Lab work on sulfate-free base, actives, fragrance and viscosity targets.",
          color: "#F97316", // Orange
          position: 1,
          startDate: addDays(-60),
          endDate: addDays(-14),
          progress: 60,
          projectId: project.id,
        },
      }),
      tx.phase.create({
        data: {
          name: "Packaging Design",
          description: "Bottle, cap and label design for an eco-friendly, premium look.",
          color: "#8B5CF6", // Purple
          position: 2,
          startDate: addDays(-45),
          endDate: addDays(7),
          progress: 35,
          projectId: project.id,
        },
      }),
      tx.phase.create({
        data: {
          name: "Clinical Tests & Safety",
          description: "Dermatological and safety testing for scalp tolerance and irritation.",
          color: "#EF4444", // Red
          position: 3,
          startDate: addDays(7),
          endDate: addDays(45),
          progress: 0,
          projectId: project.id,
        },
      }),
      tx.phase.create({
        data: {
          name: "Go-to-Market Launch",
          description: "Launch planning, channel activation and retail execution.",
          color: "#22C55E", // Green
          position: 4,
          startDate: addDays(30),
          endDate: addDays(90),
          progress: 0,
          projectId: project.id,
        },
      }),
    ]);

    const formulaPhase = phases[1];
    const packagingPhase = phases[2];
    const clinicalPhase = phases[3];

    // Sprints (Agile)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as 0
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const sprint1 = await tx.sprint.create({
      data: {
        name: "Base Formula Stability",
        goal: "Validate base formula stability and pH safety for daily use.",
        startDate: addDays(-28),
        endDate: addDays(-14),
        status: "CLOSED",
        projectId: project.id,
        phaseId: formulaPhase.id,
        organizationId: organization.id,
      },
    });

    const sprint2 = await tx.sprint.create({
      data: {
        name: "Fragrance & Viscosity",
        goal: "Optimize sensorial profile and viscosity for the Hydra-Boost shampoo.",
        startDate: startOfWeek,
        endDate: endOfWeek,
        status: "ACTIVE",
        projectId: project.id,
        phaseId: formulaPhase.id,
        organizationId: organization.id,
      },
    });

    // Features as Epics
    const sulfateFreeFeature = await tx.feature.create({
      data: {
        name: "Sulfate-Free Formula",
        description: "Core technology for a gentle, hydrating shampoo without harsh surfactants.",
        position: 0,
        projectId: project.id,
      },
    });

    const ecoBottleFeature = await tx.feature.create({
      data: {
        name: "Eco-Friendly Bottle",
        description: "100% rPET bottle with premium look and optimized shelf impact.",
        position: 1,
        projectId: project.id,
      },
    });

    // Stories with WSJF + tasks
    // Story 1: High WSJF under Sulfate-Free Formula
    const story1 = await tx.userStory.create({
      data: {
        number: 1,
        title:
          "As R&D, I want to finalize the pH balance so the shampoo is safe and gentle for daily use.",
        description:
          "Lock pH range between 4.5–5.5, validate against scalp irritation panel, and ensure compatibility with key actives.",
        status: "IN_PROGRESS",
        priority: "HIGH",
        department: "R_AND_D",
        position: 0,
        storyPoints: 5,
        // WSJF = (8 + 6 + 4) / 1 = 18
        userBusinessValue: 8,
        timeCriticality: 6,
        riskReduction: 4,
        jobSize: 1,
        projectId: project.id,
        featureId: sulfateFreeFeature.id,
        phaseId: formulaPhase.id,
        columnId: inProgressColumn.id,
        sprintId: sprint2.id,
        assigneeId: null,
        reporterId: user.id,
        organizationId: organization.id,
      },
    });

    await tx.task.createMany({
      data: [
        {
          title: "Run viscosity test at 25°C for final base formula",
          completed: false,
          position: 0,
          storyId: story1.id,
        },
        {
          title: "Check preservative system compatibility across pH range",
          completed: false,
          position: 1,
          storyId: story1.id,
        },
      ],
    });

    // Story 2: Eco-friendly bottle epic
    const story2 = await tx.userStory.create({
      data: {
        number: 2,
        title:
          "As Marketing, I want a 100% rPET bottle design that signals premium, eco-conscious personal care.",
        description:
          "Align bottle silhouette, label layout and cap color with eco-positioning while staying on brand.",
        status: "TODO",
        priority: "MEDIUM",
        department: "MARKETING",
        position: 0,
        storyPoints: 3,
        // WSJF = (6 + 4 + 2) / 1 = 12
        userBusinessValue: 6,
        timeCriticality: 4,
        riskReduction: 2,
        jobSize: 1,
        projectId: project.id,
        featureId: ecoBottleFeature.id,
        phaseId: packagingPhase.id,
        columnId: todoColumn.id,
        sprintId: sprint2.id,
        assigneeId: null,
        reporterId: user.id,
        organizationId: organization.id,
      },
    });

    await tx.task.create({
      data: {
        title: "3D render of the bottle neck and shoulder area",
        completed: false,
        position: 0,
        storyId: story2.id,
      },
    });

    // Story 3: Backlog item with DoR not ready
    const story3 = await tx.userStory.create({
      data: {
        number: 3,
        title: "Dermatological patch test for Hydra-Boost shampoo",
        description:
          "Plan dermatological patch test to confirm scalp tolerance on sensitive skin panel.",
        status: "BACKLOG",
        priority: "URGENT",
        department: "QUALITY",
        position: 0,
        storyPoints: 8,
        userBusinessValue: 7,
        timeCriticality: 7,
        riskReduction: 6,
        jobSize: 4,
        projectId: project.id,
        featureId: sulfateFreeFeature.id,
        phaseId: clinicalPhase.id,
        columnId: backlogColumn.id,
        sprintId: null,
        assigneeId: null,
        reporterId: user.id,
        organizationId: organization.id,
      },
    });

    // Mark as "Not Ready" via DoR checklist with unchecked items
    const dorItems = DEFAULT_DOR_ITEMS.length ? DEFAULT_DOR_ITEMS : ["Protocol defined", "Panel recruited"];
    await Promise.all(
      dorItems.map((title, index) =>
        tx.checklistItem.create({
          data: {
            title,
            type: "DOR",
            position: index,
            checked: false,
            storyId: story3.id,
          },
        })
      )
    );

    // Add a small DoD checklist on the first story so Done gating is visible
    await Promise.all(
      DEFAULT_DOD_ITEMS.map((title, index) =>
        tx.checklistItem.create({
          data: {
            title,
            type: "DOD",
            position: index,
            checked: index === 0,
            storyId: story1.id,
          },
        })
      )
    );

    return {
      projectId: project.id,
      projectKey: project.key,
    };
  });
}

