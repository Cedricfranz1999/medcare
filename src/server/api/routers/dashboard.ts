import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
  getStats: publicProcedure.query(async ({ ctx }) => {
    // Get counts for all metrics
    const [
      totalUsers,
      newUsersToday,
      deactivatedUsers,
      newDeactivatedToday,
      pendingUsers,
      newPendingToday,
      requestedMedicines,
      newRequestedToday,
      givenMedicines,
      newGivenToday,
      canceledMedicines,
      newCanceledToday,
      totalMedicines,
      newMedicinesToday,
      medicineCategories,
      newCategoriesToday,
    ] = await Promise.all([
      // Registered Users
      ctx.db.user.count(),
      ctx.db.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Deactivated Users
      ctx.db.user.count({
        where: { status: "DEACTIVE" },
      }),
      ctx.db.user.count({
        where: {
          status: "DEACTIVE",
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Pending Users
      ctx.db.user.count({
        where: { status: "PENDING" },
      }),
      ctx.db.user.count({
        where: {
          status: "PENDING",
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Requested Medicines
      ctx.db.medicineRequestor.count({
        where: { status: "REQUESTED" },
      }),
      ctx.db.medicineRequestor.count({
        where: {
          status: "REQUESTED",
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Given Medicines
      ctx.db.medicineRequestor.count({
        where: { status: "GIVEN" },
      }),
      ctx.db.medicineRequestor.count({
        where: {
          status: "GIVEN",
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Canceled Medicines
      ctx.db.medicineRequestor.count({
        where: { status: "CANCELLED" },
      }),
      ctx.db.medicineRequestor.count({
        where: {
          status: "CANCELLED",
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Total Medicines
      ctx.db.medicine.count(),
      ctx.db.medicine.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),

      // Medicine Categories
      ctx.db.medicineCategory.count(),
      ctx.db.medicineCategory.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalUsers,
      newUsersToday,
      deactivatedUsers,
      newDeactivatedToday,
      pendingUsers,
      newPendingToday,
      requestedMedicines,
      newRequestedToday,
      givenMedicines,
      newGivenToday,
      canceledMedicines,
      newCanceledToday,
      totalMedicines,
      newMedicinesToday,
      medicineCategories,
      newCategoriesToday,
    };
  }),
});
