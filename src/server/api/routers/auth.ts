import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import bcrypt from "bcryptjs";

export const authRouter = createTRPCRouter({
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1, "Username is required"),
        password: z.string().min(1, "Password is required"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { username, password } = input;

      const admin = await ctx.db.admin.findUnique({
        where: { username },
      });

      if (!admin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);

      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
        });
      }

      return {
        id: admin.id,
        username: admin.username,
      };
    }),
});
