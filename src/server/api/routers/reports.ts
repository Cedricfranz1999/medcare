import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const medicineReportsRouter = createTRPCRouter({
  getMedicines: publicProcedure
    .input(
      z.object({
        skip: z.number().optional(),
        take: z.number().optional(),
        search: z.string().optional(),
        stockFilter: z.enum(["all", "low", "out"]).optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereConditions: any = {};

      // Search filter
      if (input.search) {
        whereConditions.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { brand: { contains: input.search, mode: "insensitive" } },
        ];
      }

      // Stock filter
      if (input.stockFilter === "low") {
        whereConditions.stock = { lte: 10, gt: 0 };
      } else if (input.stockFilter === "out") {
        whereConditions.stock = 0;
      }

      // Date filter
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
        skip: input.skip,
        take: input.take,
        orderBy: { createdAt: "desc" },
      });

      return { data, total };
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
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereConditions: any = {};

      if (input.dateFrom || input.dateTo) {
        whereConditions.createdAt = {};
        if (input.dateFrom) {
          whereConditions.createdAt.gte = input.dateFrom;
        }
        if (input.dateTo) {
          whereConditions.createdAt.lte = input.dateTo;
        }
      }

      // Stock chart data
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
        name:
          medicine.name.length > 15
            ? medicine.name.substring(0, 15) + "..."
            : medicine.name,
        stock: medicine.stock,
      }));

      // Type distribution chart
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
      // Check if medicine has enough stock
      const medicine = await ctx.db.medicine.findUnique({
        where: { id: input.medicineId },
      });

      if (!medicine) {
        throw new Error("Medicine not found");
      }

      if (medicine.stock < input.quantity) {
        throw new Error("Insufficient stock");
      }

      // Create request
      const request = await ctx.db.medicineRequestor.create({
        data: {
          userId: input.userId,
          reason: input.reason,
          status: "REQUESTED",
        },
      });

      // Create request item
      await ctx.db.medicineRequestItem.create({
        data: {
          requestId: request.id,
          medicineId: input.medicineId,
          quantity: input.quantity,
        },
      });

      return { success: true, requestId: request.id };
    }),

  exportCSV: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        stockFilter: z.enum(["all", "low", "out"]).optional(),
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
        orderBy: { name: "asc" },
      });

      // Generate CSV
      const headers = [
        "ID",
        "Name",
        "Brand",
        "Type",
        "Dosage Form",
        "Size",
        "Stock",
        "Recommended",
        "Created At",
        "Updated At",
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
          ].join(","),
        ),
      ];

      return { csv: csvRows.join("\n") };
    }),
});
