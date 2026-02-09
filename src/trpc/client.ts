"use client";

import type { AppRouter } from "@/server/trpc/router";
import { createTRPCReact } from "@trpc/react-query";

/**
 * Client-side tRPC hooks — use in Client Components.
 *
 * Example:
 *   const { data } = trpc.project.list.useQuery();
 */
export const trpc = createTRPCReact<AppRouter>();
