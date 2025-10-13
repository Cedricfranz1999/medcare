// ~/server/api/routers/userConcern.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const userConcernRouter = createTRPCRouter({
  // Get all user concerns
  getAll: publicProcedure
    .input(
      z.object({
        skip: z.number().optional(),
        take: z.number().optional(),
        search: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.search) {
        where.OR = [
          { subject: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input.status) {
        where.status = input.status;
      }
      const total = await ctx.db.userConcern.count({ where });
      const data = await ctx.db.userConcern.findMany({
        where,
        skip: input.skip,
        take: input.take,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
        },
      });
      return { data, total };
    }),

  // Get a user concern by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.userConcern.findUnique({
        where: { id: input.id },
        include: {
          user: true,
        },
      });
    }),

  // Create or update a user concern
  createOrUpdate: publicProcedure
    .input(
      z.object({
        id: z.number().optional(),
        userId: z.number(),
        subject: z.string().min(1, "Subject is required"),
        description: z.string().min(1, "Description is required"),
        status: z.enum(["PENDING", "IN_REVIEW", "RESOLVED", "CLOSED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        // Update existing user concern
        return ctx.db.userConcern.update({
          where: { id: input.id },
          data: {
            subject: input.subject,
            description: input.description,
            status: input.status,
          },
          include: {
            user: true,
          },
        });
      } else {
        // Create new user concern
        return ctx.db.userConcern.create({
          data: {
            userId: input.userId,
            subject: input.subject,
            description: input.description,
            status: input.status || "PENDING",
          },
          include: {
            user: true,
          },
        });
      }
    }),

  // Delete a user concern
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.userConcern.delete({
        where: { id: input.id },
      });
      return { message: "User concern deleted successfully" };
    }),
    updateStatus: publicProcedure
  .input(
    z.object({
      id: z.number(),
      status: z.enum(["PENDING", "IN_REVIEW", "RESOLVED", "CLOSED"]),
    })
  )
  .mutation(async ({ ctx, input }) => {
    return ctx.db.userConcern.update({
      where: { id: input.id },
      data: { status: input.status },
    });
  }),
});
