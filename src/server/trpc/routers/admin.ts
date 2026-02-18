import { z } from "zod";
import { createTRPCRouter, orgProcedure, requireVerifiedEmailForAdmin } from "@/server/trpc/init";
import { TRPCError } from "@trpc/server";

/**
 * Admin router — FieldDefinition CRUD.
 * Only ADMINs can create/update/delete field definitions.
 */
export const adminRouter = createTRPCRouter({
  /** List all custom field definitions for the organization */
  listFields: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.fieldDefinition.findMany({
      where: { organizationId: ctx.organization.id },
      orderBy: { position: "asc" },
    });
  }),

  /** Create a new custom field definition */
  createField: orgProcedure
    .input(z.object({
      name: z.string().min(1).max(50),
      fieldKey: z.string().min(1).max(30).regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores"),
      type: z.enum(["TEXT", "NUMBER", "SELECT", "DATE", "USER"]),
      options: z.array(z.string()).default([]),
      isRequired: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can manage fields." });

      const existing = await ctx.db.fieldDefinition.findUnique({
        where: { organizationId_fieldKey: { organizationId: ctx.organization.id, fieldKey: input.fieldKey } },
      });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: `Field key "${input.fieldKey}" already exists.` });

      const count = await ctx.db.fieldDefinition.count({ where: { organizationId: ctx.organization.id } });

      return ctx.db.fieldDefinition.create({
        data: {
          name: input.name,
          fieldKey: input.fieldKey,
          type: input.type,
          options: input.options,
          isRequired: input.isRequired,
          position: count,
          organizationId: ctx.organization.id,
        },
      });
    }),

  /** Update a field definition */
  updateField: orgProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(50).optional(),
      options: z.array(z.string()).optional(),
      isRequired: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });
      const field = await ctx.db.fieldDefinition.findFirst({
        where: { id: input.id, organizationId: ctx.organization.id },
      });
      if (!field) throw new TRPCError({ code: "NOT_FOUND" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.options !== undefined) data.options = input.options;
      if (input.isRequired !== undefined) data.isRequired = input.isRequired;
      return ctx.db.fieldDefinition.update({ where: { id: input.id }, data });
    }),

  /** Delete a field definition */
  deleteField: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireVerifiedEmailForAdmin(ctx);
      if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });
      const field = await ctx.db.fieldDefinition.findFirst({
        where: { id: input.id, organizationId: ctx.organization.id },
      });
      if (!field) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db.fieldDefinition.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
