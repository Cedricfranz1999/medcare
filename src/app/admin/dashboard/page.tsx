"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";
import {
  Users,
  UserX,
  Clock,
  Pill,
  Package,
  List,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";

const DashboardPage = () => {
  // Fetch all dashboard data in parallel
  const dashboardData = api.dashboardData.getStats.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const statsConfig = [
    {
      title: "Registered Users",
      value: dashboardData.data?.totalUsers || 0,
      change: dashboardData.data?.newUsersToday || 0,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Deactivated Users",
      value: dashboardData.data?.deactivatedUsers || 0,
      change: dashboardData.data?.newDeactivatedToday || 0,
      icon: UserX,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Pending Users",
      value: dashboardData.data?.pendingUsers || 0,
      change: dashboardData.data?.newPendingToday || 0,
      icon: Clock,
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
    {
      title: "Requested Medicines",
      value: dashboardData.data?.requestedMedicines || 0,
      change: dashboardData.data?.newRequestedToday || 0,
      icon: Package,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Given Medicines",
      value: dashboardData.data?.givenMedicines || 0,
      change: dashboardData.data?.newGivenToday || 0,
      icon: Pill,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Canceled Medicines",
      value: dashboardData.data?.canceledMedicines || 0,
      change: dashboardData.data?.newCanceledToday || 0,
      icon: UserX,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Total Medicines",
      value: dashboardData.data?.totalMedicines || 0,
      change: dashboardData.data?.newMedicinesToday || 0,
      icon: Pill,
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
    {
      title: "Medicine Categories",
      value: dashboardData.data?.medicineCategories || 0,
      change: dashboardData.data?.newCategoriesToday || 0,
      icon: List,
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50",
      iconColor: "text-teal-600",
    },
  ];

  return (
    <div className="fade min-h-[700px] rounded-md bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container px-4 py-6 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-4xl font-bold text-[#0ca4d4] sm:text-5xl">
            Dashboard Overview
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Real-time insights and analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="fadeInDown 1s forwards mx-auto max-w-7xl ease-out">
          {dashboardData.isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Skeleton className="mb-2 h-8 w-full" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {statsConfig.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Card
                    key={index}
                    className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    {/* Gradient Background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 transition-opacity duration-300 group-hover:opacity-5`}
                    />

                    <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-slate-700 sm:text-base">
                        {stat.title}
                      </CardTitle>
                      <div
                        className={`rounded-full p-2 ${stat.bgColor} transition-transform duration-300 group-hover:scale-110`}
                      >
                        <IconComponent
                          className={`h-4 w-4 ${stat.iconColor} sm:h-5 sm:w-5`}
                        />
                      </div>
                    </CardHeader>

                    <CardContent className="relative pt-0">
                      <div className="mb-2 text-2xl font-bold text-slate-800 sm:text-3xl">
                        {stat.value.toLocaleString()}
                      </div>
                      <div
                        className={`flex items-center space-x-1 rounded-md ${stat.change !== 0 ? "bg-red-400 py-1 text-white" : "bg-white"} `}
                      >
                        <TrendingUp className="h-3 w-3 text-white" />
                        <p className="text-xs text-white sm:text-sm">
                          <span className="font-medium text-white">
                            +{stat.change}
                          </span>{" "}
                          today
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
