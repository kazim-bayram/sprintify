import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_BOARD_COLUMNS = [
  { name: "Backlog", position: 0 },
  { name: "To Do", position: 1 },
  { name: "In Progress", position: 2 },
  { name: "Review", position: 3 },
  { name: "Done", position: 4 },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create a demo user (will be linked to Supabase auth in real usage)
  const user = await prisma.user.upsert({
    where: { email: "demo@sprintify.app" },
    update: {},
    create: {
      supabaseId: "demo-supabase-id",
      email: "demo@sprintify.app",
      name: "Demo User",
    },
  });

  console.log(`  ✓ User: ${user.email}`);

  // Create a demo organization
  const org = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: {
      name: "Demo Organization",
      slug: "demo-org",
    },
  });

  console.log(`  ✓ Organization: ${org.name}`);

  // Add user as admin of org
  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      organizationId: org.id,
      role: "ADMIN",
    },
  });

  console.log(`  ✓ Membership: ${user.email} → ${org.name} (ADMIN)`);

  // Create a demo project
  const project = await prisma.project.upsert({
    where: {
      organizationId_key: {
        organizationId: org.id,
        key: "DEMO",
      },
    },
    update: {},
    create: {
      name: "Demo Project",
      key: "DEMO",
      description: "A sample project to explore Sprintify features.",
      organizationId: org.id,
      ticketCounter: 3,
    },
  });

  console.log(`  ✓ Project: ${project.name} (${project.key})`);

  // Create board columns
  for (const col of DEFAULT_BOARD_COLUMNS) {
    await prisma.boardColumn.upsert({
      where: {
        projectId_position: {
          projectId: project.id,
          position: col.position,
        },
      },
      update: { name: col.name },
      create: {
        name: col.name,
        position: col.position,
        projectId: project.id,
      },
    });
  }

  console.log(`  ✓ Board columns: ${DEFAULT_BOARD_COLUMNS.length} created`);

  // Get columns for ticket assignment
  const columns = await prisma.boardColumn.findMany({
    where: { projectId: project.id },
    orderBy: { position: "asc" },
  });

  const todoColumn = columns.find((c) => c.name === "To Do");
  const inProgressColumn = columns.find((c) => c.name === "In Progress");
  const backlogColumn = columns.find((c) => c.name === "Backlog");

  // Create sample tickets
  const tickets = [
    {
      number: 1,
      title: "Set up project scaffolding",
      description: "Initialize Next.js with Tailwind, shadcn/ui, and Prisma.",
      status: "IN_PROGRESS",
      columnId: inProgressColumn?.id,
      storyPoints: 3,
      position: 0,
      metadata: { priority: "HIGH", labels: ["setup"] },
    },
    {
      number: 2,
      title: "Design database schema",
      description: "Create Prisma schema for users, orgs, projects, tickets.",
      status: "TODO",
      columnId: todoColumn?.id,
      storyPoints: 5,
      position: 0,
      metadata: { priority: "HIGH", labels: ["database"] },
    },
    {
      number: 3,
      title: "Implement authentication flow",
      description: "Integrate Supabase Auth with GitHub and Google OAuth.",
      status: "BACKLOG",
      columnId: backlogColumn?.id,
      storyPoints: 3,
      position: 0,
      metadata: { priority: "MEDIUM", labels: ["auth"] },
    },
  ];

  for (const ticket of tickets) {
    await prisma.ticket.upsert({
      where: {
        projectId_number: {
          projectId: project.id,
          number: ticket.number,
        },
      },
      update: {},
      create: {
        ...ticket,
        projectId: project.id,
        reporterId: user.id,
        organizationId: org.id,
      },
    });
  }

  console.log(`  ✓ Tickets: ${tickets.length} created`);
  console.log("\n✅ Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
