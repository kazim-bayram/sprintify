import { createTRPCRouter } from "./init";
import { projectRouter } from "./routers/project";
import { ticketRouter } from "./routers/ticket";
import { organizationRouter } from "./routers/organization";
import { commentRouter } from "./routers/comment";
import { labelRouter } from "./routers/label";
import { memberRouter } from "./routers/member";
import { searchRouter } from "./routers/search";
import { sprintRouter } from "./routers/sprint";

/**
 * Root tRPC router — all sub-routers are merged here.
 */
export const appRouter = createTRPCRouter({
  project: projectRouter,
  ticket: ticketRouter,
  organization: organizationRouter,
  comment: commentRouter,
  label: labelRouter,
  member: memberRouter,
  search: searchRouter,
  sprint: sprintRouter,
});

export type AppRouter = typeof appRouter;
