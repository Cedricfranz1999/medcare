// src/server/api/routers/medicineRequests.ts
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import type { Prisma } from "@prisma/client";

export const medicineRequestsRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        status: z.enum(["REQUESTED", "GIVEN", "CANCELLED", "APPROVED"]).optional(),
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
        status: z.enum(["REQUESTED", "GIVEN", "CANCELLED", "APPROVED"]),
        cancelledReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Start a transaction to ensure data consistency
      return await ctx.db.$transaction(async (tx) => {
        const request = await tx.medicineRequestor.findUnique({
          where: { id: input.id },
          include: {
            medicines: {
              include: {
                medicine: true,
              },
            },
          },
        });

        if (!request) {
          throw new Error("Medicine request not found");
        }

        const data: Prisma.MedicineRequestorUpdateInput = {
          status: input.status,
          updatedAt: new Date(),
        };

        // If status is being changed to GIVEN, deduct stock
        if (input.status === "GIVEN" && request.status !== "GIVEN") {
          // Check if all medicines have sufficient stock
          for (const item of request.medicines) {
            if (item.medicine.stock < item.quantity) {
              throw new Error(
                `Insufficient stock for ${item.medicine.name}. Available: ${item.medicine.stock}, Requested: ${item.quantity}`
              );
            }
          }

          // Deduct stock for all medicines
          for (const item of request.medicines) {
            await tx.medicine.update({
              where: { id: item.medicineId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }

          data.givenAt = new Date();
        } 
        // If status is being changed to APPROVED, just update the timestamp
        else if (input.status === "APPROVED") {
          data.approvedAt = new Date();
        } 
        // If status is being changed to CANCELLED
        else if (input.status === "CANCELLED") {
          data.cancelledReason = input.cancelledReason;
          
          // If request was previously GIVEN, restore stock
          if (request.status === "GIVEN") {
            for (const item of request.medicines) {
              await tx.medicine.update({
                where: { id: item.medicineId },
                data: {
                  stock: {
                    increment: item.quantity,
                  },
                },
              });
            }
          }
        }

        return tx.medicineRequestor.update({
          where: { id: input.id },
          data,
        });
      });
    }),

  updateQuantities: publicProcedure
    .input(
      z.object({
        requestId: z.number(),
        quantities: z.record(z.number()), // { medicineId: quantity }
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        const request = await tx.medicineRequestor.findUnique({
          where: { id: input.requestId },
          include: {
            medicines: {
              include: {
                medicine: true,
              },
            },
          },
        });

        if (!request) {
          throw new Error("Medicine request not found");
        }

        if (request.status !== "REQUESTED") {
          throw new Error("Can only update quantities for requests with REQUESTED status");
        }

        // Update each medicine quantity in the request
        for (const [medicineIdStr, quantity] of Object.entries(input.quantities)) {
          const medicineId = parseInt(medicineIdStr);
          
          if (quantity <= 0) {
            throw new Error(`Quantity must be greater than 0 for medicine ID: ${medicineId}`);
          }

          // Check if the medicine exists in the request
          const existingItem = request.medicines.find(item => item.medicineId === medicineId);
          if (!existingItem) {
            throw new Error(`Medicine with ID ${medicineId} not found in request`);
          }

          // Check stock availability
          const medicine = await tx.medicine.findUnique({
            where: { id: medicineId },
          });

          if (!medicine) {
            throw new Error(`Medicine with ID ${medicineId} not found`);
          }

          if (medicine.stock < quantity) {
            throw new Error(
              `Insufficient stock for ${medicine.name}. Available: ${medicine.stock}, Requested: ${quantity}`
            );
          }

          // Update the quantity
          await tx.medicineRequestItem.update({
            where: {
              id: existingItem.id,
            },
            data: {
              quantity: quantity,
            },
          });
        }

        return { success: true };
      });
    }),
});