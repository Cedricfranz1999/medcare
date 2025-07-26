// ~/server/api/routers/medicineCategory.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const medicineRouterCategory = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        skip: z.number().optional(),
        take: z.number().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const total = await ctx.db.medicineCategory.count({
        where: input.search
          ? {
              name: { contains: input.search, mode: "insensitive" },
            }
          : undefined,
      });
      const data = await ctx.db.medicineCategory.findMany({
        where: input.search
          ? {
              name: { contains: input.search, mode: "insensitive" },
            }
          : undefined,
        skip: input.skip,
        take: input.take,
        orderBy: { id: "asc" },
      });

      return { data, total };
    }),

  createOrUpdate: publicProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1, "Name is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        // Update existing category
        return ctx.db.medicineCategory.update({
          where: { id: input.id },
          data: {
            name: input.name,
          },
        });
      } else {
        // Create new category
        return ctx.db.medicineCategory.create({
          data: {
            name: input.name,
          },
        });
      }
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.medicineCategory.delete({
        where: { id: input.id },
      });
      return { message: "Category deleted successfully" };
    }),
});
