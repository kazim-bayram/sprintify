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

/**
 * Root tRPC router — all sub-routers merged here.
 * Sprintify NPD: FMCG New Product Development Platform.
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
});

export type AppRouter = typeof appRouter;
