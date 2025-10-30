import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";

export const medicineReportsRouter = createTRPCRouter({
  getMedicines: publicProcedure
    .input(
      z.object({
        skip: z.number().optional(),
        take: z.number().optional(),
        search: z.string().optional(),
        stockFilter: z.enum(["all", "low", "out"]).optional(),
        type: z.string().optional(),
        category: z.string().optional(),
        expiryFilter: z.enum(["all", "expired", "expiring"]).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereConditions: any = {};
      if (input.search) {
        whereConditions.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { brand: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input.stockFilter === "low") {
        whereConditions.stock = { lte: 10, gt: 0 };
      } else if (input.stockFilter === "out") {
        whereConditions.stock = 0;
      }
      if (input.type && input.type !== "all") {
        whereConditions.type = input.type;
      }
      if (input.category && input.category !== "all") {
        whereConditions.categories = { some: { category: { name: input.category } } };
      }
      if (input.expiryFilter === "expired") {
        whereConditions.expiryDate = { lt: new Date() };
      } else if (input.expiryFilter === "expiring") {
        const expiryThreshold = new Date();
        expiryThreshold.setDate(expiryThreshold.getDate() + 30);
        whereConditions.expiryDate = { lt: expiryThreshold, gte: new Date() };
      }
      if (input.dateFrom || input.dateTo) {
        whereConditions.createdAt = {};
        if (input.dateFrom) {
          whereConditions.createdAt.gte = input.dateFrom;
        }
        if (input.dateTo) {
          whereConditions.createdAt.lte = input.dateTo;
        }
      }
      const total = await ctx.db.medicine.count({ where: whereConditions });
      const data = await ctx.db.medicine.findMany({
        where: whereConditions,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
        skip: input.skip,
        take: input.take,
        orderBy: { createdAt: "desc" },
      });
      return {
        data: data.map((m) => ({
          ...m,
          category: m.categories[0]?.category.name || "Uncategorized",
        })),
        total,
      };
    }),

  getRequests: publicProcedure
    .input(
      z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereConditions: any = {};
      if (input.dateFrom || input.dateTo) {
        whereConditions.requestedAt = {};
        if (input.dateFrom) {
          whereConditions.requestedAt.gte = input.dateFrom;
        }
        if (input.dateTo) {
          whereConditions.requestedAt.lte = input.dateTo;
        }
      }
      return ctx.db.medicineRequestor.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              name: true,
              username: true,
            },
          },
          medicines: {
            include: {
              medicine: true,
            },
          },
        },
        orderBy: { requestedAt: "desc" },
      });
    }),

  getChartData: publicProcedure
    .input(
      z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
        stockFilter: z.enum(["all", "low", "out"]).optional(),
        type: z.string().optional(),
        category: z.string().optional(),
        expiryFilter: z.enum(["all", "expired", "expiring"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereConditions: any = {};
      if (input.stockFilter === "low") {
        whereConditions.stock = { lte: 10, gt: 0 };
      } else if (input.stockFilter === "out") {
        whereConditions.stock = 0;
      }
      if (input.type && input.type !== "all") {
        whereConditions.type = input.type;
      }
      if (input.category && input.category !== "all") {
        whereConditions.categories = { some: { category: { name: input.category } } };
      }
      if (input.expiryFilter === "expired") {
        whereConditions.expiryDate = { lt: new Date() };
      } else if (input.expiryFilter === "expiring") {
        const expiryThreshold = new Date();
        expiryThreshold.setDate(expiryThreshold.getDate() + 30);
        whereConditions.expiryDate = { lt: expiryThreshold, gte: new Date() };
      }
      if (input.dateFrom || input.dateTo) {
        whereConditions.createdAt = {};
        if (input.dateFrom) {
          whereConditions.createdAt.gte = input.dateFrom;
        }
        if (input.dateTo) {
          whereConditions.createdAt.lte = input.dateTo;
        }
      }
      const medicines = await ctx.db.medicine.findMany({
        where: whereConditions,
        select: {
          name: true,
          stock: true,
          type: true,
        },
        orderBy: { stock: "desc" },
        take: 10,
      });
      const stockChart = medicines.map((medicine) => ({
        name: medicine.name.length > 15 ? medicine.name.substring(0, 15) + "..." : medicine.name,
        stock: medicine.stock,
      }));
      const typeData = await ctx.db.medicine.groupBy({
        by: ["type"],
        where: whereConditions,
        _count: {
          type: true,
        },
      });
      const typeChart = typeData.map((item) => ({
        name: item.type,
        count: item._count.type,
      }));
      return {
        stockChart,
        typeChart,
      };
    }),

  requestMedicine: publicProcedure
    .input(
      z.object({
        medicineId: z.number(),
        quantity: z.number().min(1),
        reason: z.string().min(1),
        userId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const medicine = await ctx.db.medicine.findUnique({
        where: { id: input.medicineId },
      });
      if (!medicine) {
        throw new Error("Medicine not found");
      }
      if (medicine.stock < input.quantity) {
        throw new Error("Insufficient stock");
      }
      const request = await ctx.db.medicineRequestor.create({
        data: {
          userId: input.userId,
          reason: input.reason,
          status: "REQUESTED",
        },
      });
      await ctx.db.medicineRequestItem.create({
        data: {
          requestId: request.id,
          medicineId: input.medicineId,
          quantity: input.quantity,
        },
      });
      return { success: true, requestId: request.id };
    }),

  exportMedicinesCSV: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        stockFilter: z.enum(["all", "low", "out"]).optional(),
        type: z.string().optional(),
        category: z.string().optional(),
        expiryFilter: z.enum(["all", "expired", "expiring"]).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const whereConditions: any = {};
      if (input.search) {
        whereConditions.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { brand: { contains: input.search, mode: "insensitive" } },
        ];
      }
      if (input.stockFilter === "low") {
        whereConditions.stock = { lte: 10, gt: 0 };
      } else if (input.stockFilter === "out") {
        whereConditions.stock = 0;
      }
      if (input.type && input.type !== "all") {
        whereConditions.type = input.type;
      }
      if (input.category && input.category !== "all") {
        whereConditions.categories = { some: { category: { name: input.category } } };
      }
      if (input.expiryFilter === "expired") {
        whereConditions.expiryDate = { lt: new Date() };
      } else if (input.expiryFilter === "expiring") {
        const expiryThreshold = new Date();
        expiryThreshold.setDate(expiryThreshold.getDate() + 30);
        whereConditions.expiryDate = { lt: expiryThreshold, gte: new Date() };
      }
      if (input.dateFrom || input.dateTo) {
        whereConditions.createdAt = {};
        if (input.dateFrom) {
          whereConditions.createdAt.gte = input.dateFrom;
        }
        if (input.dateTo) {
          whereConditions.createdAt.lte = input.dateTo;
        }
      }
      const medicines = await ctx.db.medicine.findMany({
        where: whereConditions,
        include: {
          categories: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });
      const headers = [
        "ID", "Name", "Brand", "Type", "Dosage Form", "Size", "Stock", "Recommended", "Created At", "Updated At", "Expiry Date", "Category"
      ];
      const csvRows = [
        headers.join(","),
        ...medicines.map((medicine) =>
          [
            medicine.id,
            `"${medicine.name}"`,
            `"${medicine.brand}"`,
            medicine.type,
            medicine.dosageForm,
            medicine.size ? `"${medicine.size}"` : "",
            medicine.stock,
            medicine.recommended,
            medicine.createdAt.toISOString(),
            medicine.updatedAt.toISOString(),
            medicine.expiryDate ? medicine.expiryDate.toISOString() : "",
            `"${medicine.categories[0]?.category.name || "Uncategorized"}"`,
          ].join(","),
        ),
      ];
      return { csv: csvRows.join("\n") };
    }),

  exportRequestsCSV: publicProcedure
    .input(
      z.object({
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const whereConditions: any = {};
      if (input.dateFrom || input.dateTo) {
        whereConditions.requestedAt = {};
        if (input.dateFrom) {
          whereConditions.requestedAt.gte = input.dateFrom;
        }
        if (input.dateTo) {
          whereConditions.requestedAt.lte = input.dateTo;
        }
      }
      const requests = await ctx.db.medicineRequestor.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              name: true,
              username: true,
            },
          },
          medicines: {
            include: {
              medicine: true,
            },
          },
        },
        orderBy: { requestedAt: "desc" },
      });
      const headers = [
        "Request ID", "Requested By", "Username", "Reason", "Status", "Requested At", "Approved At", "Given At", "Medicine Count", "Medicine Names", "Quantities"
      ];
      const csvRows = [
        headers.join(","),
        ...requests.map((request) => {
          const medicineNames = request.medicines.map((item) => item.medicine.name).join("; ");
          const quantities = request.medicines.map((item) => item.quantity).join("; ");
          return [
            request.id,
            `"${request.user.name}"`,
            `"${request.user.username}"`,
            `"${request.reason}"`,
            request.status,
            request.requestedAt.toISOString(),
            request.approvedAt ? request.approvedAt.toISOString() : "",
            request.givenAt ? request.givenAt.toISOString() : "",
            request.medicines.length,
            `"${medicineNames}"`,
            `"${quantities}"`,
          ].join(",");
        }),
      ];
      return { csv: csvRows.join("\n") };
    }),
});
