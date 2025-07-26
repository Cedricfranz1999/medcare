// src/server/api/routers/medicineRequests.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { Prisma } from "@prisma/client";

export const medicineRequestsRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        status: z.enum(["REQUESTED", "GIVEN", "CANCELLED"]).optional(),
        skip: z.number().optional(),
        take: z.number().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Prisma.MedicineRequestorWhereInput = {};

      if (input.status) {
        where.status = input.status;
      }

      if (input.search) {
        where.OR = [
          {
            user: { name: { contains: input.search, mode: "insensitive" } },
          },
          {
            user: { username: { contains: input.search, mode: "insensitive" } },
          },
          {
            medicines: {
              some: {
                medicine: {
                  name: { contains: input.search, mode: "insensitive" },
                },
              },
            },
          },
          {
            medicines: {
              some: {
                medicine: {
                  brand: { contains: input.search, mode: "insensitive" },
                },
              },
            },
          },
        ];
      }

      const [requests, total] = await Promise.all([
        ctx.db.medicineRequestor.findMany({
          where,
          skip: input.skip,
          take: input.take,
          orderBy: { requestedAt: "desc" },
          include: {
            user: true,
            medicines: {
              include: {
                medicine: true,
              },
            },
          },
        }),
        ctx.db.medicineRequestor.count({ where }),
      ]);

      return { requests, total };
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["REQUESTED", "GIVEN", "CANCELLED"]),
        cancelledReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const data: Prisma.MedicineRequestorUpdateInput = {
        status: input.status,
        updatedAt: new Date(),
      };

      if (input.status === "GIVEN") {
        data.givenAt = new Date();
      } else if (input.status === "CANCELLED") {
        data.cancelledReason = input.cancelledReason;
      }

      return ctx.db.medicineRequestor.update({
        where: { id: input.id },
        data,
      });
    }),
});
