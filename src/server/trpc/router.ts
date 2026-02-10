import { createTRPCRouter } from "./init";
import { projectRouter } from "./routers/project";
import { storyRouter } from "./routers/story";
import { organizationRouter } from "./routers/organization";
import { commentRouter } from "./routers/comment";
import { labelRouter } from "./routers/label";
import { memberRouter } from "./routers/member";
import { searchRouter } from "./routers/search";
import { sprintRouter } from "./routers/sprint";
import { programRouter } from "./routers/program";
import { featureRouter } from "./routers/feature";
import { taskRouter } from "./routers/task";
import { checklistRouter } from "./routers/checklist";
import { adminRouter } from "./routers/admin";

/**
 * Root tRPC router — all sub-routers merged here.
 * Sprintify NPD: Fully Configurable Enterprise Platform.
 */
export const appRouter = createTRPCRouter({
  project: projectRouter,
  story: storyRouter,
  organization: organizationRouter,
  comment: commentRouter,
  label: labelRouter,
  member: memberRouter,
  search: searchRouter,
  sprint: sprintRouter,
  program: programRouter,
  feature: featureRouter,
  task: taskRouter,
  checklist: checklistRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
