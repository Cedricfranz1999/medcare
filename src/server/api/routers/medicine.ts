// ~/server/api/routers/medicine.ts
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { uploadImage } from "~/lib/upload/uploadImage";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const medicineRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        skip: z.number().optional(),
        take: z.number().optional(),
        search: z.string().optional(),
        categoryId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.MedicineWhereInput = {};

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { brand: { contains: input.search, mode: "insensitive" } },
        ];
      }

      if (input.categoryId) {
        where.categories = {
          some: {
            categoryId: input.categoryId,
          },
        };
      }

      const total = await ctx.db.medicine.count({ where });
      const data = await ctx.db.medicine.findMany({
        where,
        skip: input.skip,
        take: input.take,
        orderBy: { id: "asc" },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });

      return { data, total };
    }),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.medicine.findUnique({
        where: { id: input.id },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
      });
    }),

  createOrUpdate: publicProcedure
    .input(
      z.object({
        id: z.number().optional(),
        image: z.string().optional(),
        name: z.string().min(1, "Name is required"),
        brand: z.string().min(1, "Brand is required"),
        description: z.string().optional(),
        type: z.enum(["OTC", "PRESCRIPTION"]),
        dosageForm: z.enum([
          "TABLET",
          "SYRUP",
          "CAPSULE",
          "INJECTION",
          "CREAM",
          "DROPS",
        ]),
        size: z.string().optional(),
        stock: z.number().min(0, "Stock cannot be negative"),
        categoryIds: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      console.log("ZZZ", input);
      const data = {
        name: input.name,
        brand: input.brand,
        description: input.description,
        type: input.type,
        dosageForm: input.dosageForm,
        size: input.size,
        stock: input.stock,
        image: input.image,
      };

      if (input.id) {
        // Update existing medicine
        const medicine = await ctx.db.medicine.update({
          where: { id: input.id },
          data: {
            ...data,
            categories: input.categoryIds
              ? {
                  // Delete existing connections and create new ones
                  deleteMany: {},
                  create: input.categoryIds.map((categoryId) => ({
                    categoryId,
                  })),
                }
              : undefined,
          },
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        });

        return medicine;
      } else {
        // Create new medicine
        const medicine = await ctx.db.medicine.create({
          data: {
            ...data,
            categories: input.categoryIds
              ? {
                  create: input.categoryIds.map((categoryId) => ({
                    categoryId,
                  })),
                }
              : undefined,
          },
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        });

        return medicine;
      }
    }),

  uploadImage: publicProcedure
    .input(z.object({ file: z.custom<File>() }))
    .mutation(async ({ input }) => {
      return uploadImage(input.file);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.medicine.delete({
        where: { id: input.id },
      });
      return { message: "Medicine deleted successfully" };
    }),

  getCategories: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.medicineCategory.findMany({
      orderBy: { name: "asc" },
    });
  }),
});
