import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { Prisma } from "@prisma/client";

export const usersRouter = createTRPCRouter({
  getAllUsers: publicProcedure
    .input(
      z.object({
        searchTerm: z.string().optional(),
        status: z.enum(["PENDING", "APPROVED", "DEACTIVE"]).optional(),
        skip: z.number().optional(),
        take: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.userWhereInput = {}; // Changed from UserWhereInput to userWhereInput

      if (input.searchTerm) {
        where.OR = [
          { username: { contains: input.searchTerm, mode: "insensitive" } },
          { name: { contains: input.searchTerm, mode: "insensitive" } },
          { lastName: { contains: input.searchTerm, mode: "insensitive" } },
        ];
      }

      if (input.status) {
        where.status = input.status;
      }

      const [users, totalCount] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip: input.skip,
          take: input.take,
          orderBy: { createdAt: "desc" },
        }),
        ctx.db.user.count({ where }),
      ]);

      return { users, totalCount };
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        status: z.enum(["PENDING", "APPROVED", "DEACTIVE"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: {
          status: input.status,
        },
      });
    }),
});
