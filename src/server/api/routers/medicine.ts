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
        expiryDate: z.date().optional().nullable(),
        stock: z.number().min(0, "Stock cannot be negative"),
        categoryIds: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data = {
        name: input.name,
        brand: input.brand,
        description: input.description,
        type: input.type,
        dosageForm: input.dosageForm,
        size: input.size,
        expiryDate: input.expiryDate,
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

  getLowStock: publicProcedure.query(async ({ ctx }) => {
    const medicines = await ctx.db.medicine.findMany({
      where: {
        stock: {
          lte: 10,
        },
      },
      orderBy: { stock: "asc" },
      select: {
        id: true,
        name: true,
        stock: true,
      },
    });
    return {
      count: medicines.length,
      medicines,
    };
  }),

  getNearExpiry: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(today.getMonth() + 2);

    const medicines = await ctx.db.medicine.findMany({
      where: {
        expiryDate: {
          lte: twoMonthsFromNow,
          gte: today,
        },
      },
      orderBy: { expiryDate: "asc" },
      select: {
        id: true,
        name: true,
        expiryDate: true,
        stock: true,
      },
    });
    return {
      count: medicines.length,
      medicines,
    };
  }),

  getExpired: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();

    const medicines = await ctx.db.medicine.findMany({
      where: {
        expiryDate: {
          lt: today,
        },
      },
      orderBy: { expiryDate: "asc" },
      select: {
        id: true,
        name: true,
        expiryDate: true,
        stock: true,
      },
    });
    return {
      count: medicines.length,
      medicines,
    };
  }),

  updateAllNotificationOpen: publicProcedure
    .mutation(async ({ ctx }) => {
      await ctx.db.medicine.updateMany({
        where: {},
        data: { notificationopen: true },
      });
      return { success: true };
    }),

  updateLowStockNotificationOpen: publicProcedure
    .input(z.object({ to: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.medicine.updateMany({
        where: { stock: { lte: 10 } },
        data: { notificationopen: input.to },
      });
      return { success: true };
    }),

  updateNearExpiryNotificationOpen: publicProcedure
    .input(z.object({ to: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const today = new Date();
      const twoMonthsFromNow = new Date();
      twoMonthsFromNow.setMonth(today.getMonth() + 2);

      await ctx.db.medicine.updateMany({
        where: {
          expiryDate: {
            lte: twoMonthsFromNow,
            gte: today,
          }
        },
        data: { notificationopen: input.to },
      });
      return { success: true };
    }),

  getLowStockCount: publicProcedure.query(async ({ ctx }) => {
    const medicines = await ctx.db.medicine.findMany({
      where: {
        stock: {
          lte: 10,
        },
        notificationopen: true
      },
      orderBy: { stock: "asc" },
      select: {
        id: true,
        name: true,
        stock: true,
      },
    });
    return {
      count: medicines.length,
      medicines,
    };
  }),

  getNearExpiryCount: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(today.getMonth() + 2);

    const medicines = await ctx.db.medicine.findMany({
      where: {
        expiryDate: {
          lte: twoMonthsFromNow,
          gte: today,
        },
        notificationopen: true
      },
      orderBy: { expiryDate: "asc" },
      select: {
        id: true,
        name: true,
        expiryDate: true,
        stock: true,
      },
    });
    return {
      count: medicines.length,
      medicines,
    };
  }),

  getExpiredCount: publicProcedure.query(async ({ ctx }) => {
    const today = new Date();

    const medicines = await ctx.db.medicine.findMany({
      where: {
        expiryDate: {
          lt: today,
        },
        notificationopen: true
      },
      orderBy: { expiryDate: "asc" },
      select: {
        id: true,
        name: true,
        expiryDate: true,
        stock: true,
      },
    });
    return {
      count: medicines.length,
      medicines,
    };
  }),
});
