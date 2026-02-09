import "server-only";
import { createTRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/router";
import { createCallerFactory } from "@/server/trpc/init";

/**
 * Server-side tRPC caller — use in Server Components and Server Actions.
 *
 * Example:
 *   const projects = await api.project.list();
 */
const createCaller = createCallerFactory(appRouter);

export async function api() {
  const ctx = await createTRPCContext();
  return createCaller(ctx);
}
