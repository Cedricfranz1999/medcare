import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { Prisma } from "@prisma/client";

export const medicineRecommendationRouter = createTRPCRouter({
  getAllMedicines: publicProcedure
    .input(
      z.object({
        searchTerm: z.string().optional(),
        categoryId: z.number().optional(),
        medicineType: z.enum(["OTC", "PRESCRIPTION"]).optional(),
        recommendedOnly: z.boolean().optional(),
        skip: z.number().optional(),
        take: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.MedicineWhereInput = {};

      if (input.searchTerm) {
        where.OR = [
          { name: { contains: input.searchTerm, mode: "insensitive" } },
          { brand: { contains: input.searchTerm, mode: "insensitive" } },
        ];
      }

      if (input.categoryId) {
        where.categories = {
          some: {
            categoryId: input.categoryId,
          },
        };
      }

      if (input.medicineType) {
        where.type = input.medicineType;
      }

      if (input.recommendedOnly) {
        where.recommended = { equals: true }; // Changed from direct assignment to using equals
      }

      const [medicines, totalCount] = await Promise.all([
        ctx.db.medicine.findMany({
          where,
          skip: input.skip,
          take: input.take,
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
          orderBy: { name: "asc" },
        }),
        ctx.db.medicine.count({ where }),
      ]);

      return { medicines, totalCount };
    }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.medicineCategory.findMany({
      orderBy: { name: "asc" },
    });
  }),

  toggleRecommended: publicProcedure
    .input(z.object({ medicineId: z.number(), recommended: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.medicine.update({
        where: { id: input.medicineId },
        data: {
          recommended: input.recommended,
        },
      });
    }),
});
