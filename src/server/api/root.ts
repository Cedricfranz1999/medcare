import { postRouter } from "~/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "./routers/auth";
import { medicineRouterCategory } from "./routers/medicineCategory";
import { medicineRouter } from "./routers/medicine";
import { medicineRecommendationRouter } from "./routers/medicineRecommendation";
import { usersRouter } from "./routers/users";
import { medicineRequestsRouter } from "./routers/request";
import { dashboardRouter } from "./routers/dashboard";
import { medicineReportsRouter } from "./routers/reports";
import { userConcernRouter } from "./routers/userConcern";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  auth: authRouter,
  medicineRouterCategory: medicineRouterCategory,
  medicine: medicineRouter,
  medicineRecommendation: medicineRecommendationRouter,
  user: usersRouter,
  medicineReqeust: medicineRequestsRouter,
  dashboardData: dashboardRouter,
  reporstData: medicineReportsRouter,
  userConcern:userConcernRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
