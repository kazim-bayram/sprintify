import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_BOARD_COLUMNS = [
  { name: "Backlog", position: 0 },
  { name: "To Do", position: 1 },
  { name: "In Progress", position: 2 },
  { name: "Evaluation / Lab", position: 3 },
  { name: "Done", position: 4 },
];

async function main() {
  console.log("🌱 Seeding Sprintify NPD database...");

  // Demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@sprintify.app" },
    update: {},
    create: {
      supabaseId: "demo-supabase-id",
      email: "demo@sprintify.app",
      name: "Demo User",
      department: "R_AND_D",
    },
  });
  console.log(`  ✓ User: ${user.email}`);

  // Demo organization
  const org = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: { name: "Demo FMCG Corp", slug: "demo-org" },
  });
  console.log(`  ✓ Organization: ${org.name}`);

  // Membership
  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: { userId: user.id, organizationId: org.id, role: "ADMIN" },
  });
  console.log(`  ✓ Membership: ${user.email} → ${org.name} (ADMIN)`);

  // Demo program (brand)
  const program = await prisma.program.upsert({
    where: { id: "demo-program" },
    update: {},
    create: { id: "demo-program", name: "Healthy Snacks", description: "Health-focused snack product line", organizationId: org.id },
  });
  console.log(`  ✓ Program: ${program.name}`);

  // Demo project
  const project = await prisma.project.upsert({
    where: { organizationId_key: { organizationId: org.id, key: "PROTBAR" } },
    update: {},
    create: {
      name: "Protein Bar Launch",
      key: "PROTBAR",
      description: "New protein bar product for Q3 launch.",
      organizationId: org.id,
      programId: program.id,
      storyCounter: 3,
    },
  });
  console.log(`  ✓ Project: ${project.name} (${project.key})`);

  // Board columns
  for (const col of DEFAULT_BOARD_COLUMNS) {
    await prisma.boardColumn.upsert({
      where: { projectId_position: { projectId: project.id, position: col.position } },
      update: { name: col.name },
      create: { name: col.name, position: col.position, projectId: project.id },
    });
  }
  console.log(`  ✓ Board columns: ${DEFAULT_BOARD_COLUMNS.length} created`);

  // Features (stages)
  const features = ["Formula Development", "Packaging Design", "Lab Testing", "Regulatory Check", "Launch Prep"];
  for (let i = 0; i < features.length; i++) {
    await prisma.feature.upsert({
      where: { id: `demo-feature-${i}` },
      update: {},
      create: { id: `demo-feature-${i}`, name: features[i], position: i, projectId: project.id },
    });
  }
  console.log(`  ✓ Features: ${features.length} stages created`);

  // Get columns
  const columns = await prisma.boardColumn.findMany({
    where: { projectId: project.id },
    orderBy: { position: "asc" },
  });
  const todoColumn = columns.find((c) => c.name === "To Do");
  const inProgressColumn = columns.find((c) => c.name === "In Progress");
  const backlogColumn = columns.find((c) => c.name === "Backlog");

  // Sample user stories
  const stories = [
    {
      number: 1,
      title: "Develop protein bar base formula (v1)",
      description: "As R&D, I need to test 3 formula variants for taste and texture.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      department: "R_AND_D" as const,
      columnId: inProgressColumn?.id,
      storyPoints: 5,
      position: 0,
      userBusinessValue: 8,
      timeCriticality: 7,
      riskReduction: 5,
      jobSize: 5,
    },
    {
      number: 2,
      title: "Design packaging mockup for retail",
      description: "As Marketing, I need 3 packaging concepts for focus group testing.",
      status: "TODO",
      priority: "MEDIUM",
      department: "PACKAGING" as const,
      columnId: todoColumn?.id,
      storyPoints: 3,
      position: 0,
      userBusinessValue: 6,
      timeCriticality: 4,
      riskReduction: 2,
      jobSize: 3,
    },
    {
      number: 3,
      title: "Shelf life test - 6 month stability",
      description: "As Quality, I need to validate 6-month shelf stability for regulatory filing.",
      status: "BACKLOG",
      priority: "URGENT",
      department: "QUALITY" as const,
      columnId: backlogColumn?.id,
      storyPoints: 8,
      position: 0,
      userBusinessValue: 9,
      timeCriticality: 9,
      riskReduction: 8,
      jobSize: 8,
    },
  ];

  for (const story of stories) {
    await prisma.userStory.upsert({
      where: { projectId_number: { projectId: project.id, number: story.number } },
      update: {},
      create: { ...story, projectId: project.id, reporterId: user.id, organizationId: org.id },
    });
  }
  console.log(`  ✓ User Stories: ${stories.length} created`);

  // Default DoD items for first story
  const dodItems = ["Formula approved by R&D lead", "Taste test passed (>7/10 score)", "Nutritional analysis complete"];
  for (let i = 0; i < dodItems.length; i++) {
    await prisma.checklistItem.create({
      data: {
        title: dodItems[i],
        type: "DOD",
        position: i,
        storyId: (await prisma.userStory.findFirst({ where: { projectId: project.id, number: 1 } }))!.id,
      },
    });
  }
  console.log(`  ✓ DoD checklist: ${dodItems.length} items`);

  console.log("\n✅ Seed complete! Sprintify NPD is ready.");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
