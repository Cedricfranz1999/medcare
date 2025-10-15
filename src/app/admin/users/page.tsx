"use client";

import React, { useState, useMemo } from "react";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Filter,
  X,
  ArrowUpDown,
  Check,
  Ban,
  Clock,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { type UserStatus } from "@prisma/client";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

const UsersPage = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 10;

  const { data, refetch, isLoading } = api.user.getAllUsers.useQuery({
    skip: (page - 1) * pageSize,
    take: pageSize,
    searchTerm: searchTerm || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });

  const updateStatusMutation = api.user.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "User status updated",
        variant: "default",
        className: "bg-green-500 text-white",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "ALL") count++;
    if (searchTerm) count++;
    return count;
  }, [statusFilter, searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleUpdateStatus = (userId: number, status: UserStatus) => {
    updateStatusMutation.mutate({ userId, status });
  };

  const clearAllFilters = () => {
    setStatusFilter("ALL");
    setSearchTerm("");
    setPage(1);
  };

  const TableSkeleton = () => (
    <div className="space-y-3 p-4">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48 rounded-full" />
                <Skeleton className="h-3 w-32 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-9 w-32 rounded-full" />
            </div>
          </div>
        ))}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <User className="h-12 w-12 text-blue-500" />
      </div>
      <h3 className="mb-3 text-xl font-semibold text-gray-900">
        No users found
      </h3>
      <p className="mb-6 max-w-md leading-relaxed text-gray-600">
        {searchTerm
          ? `No results found for "${searchTerm}". Try adjusting your search or filters.`
          : "No users match your current filters. Try broadening your criteria."}
      </p>
      {(searchTerm || activeFiltersCount > 0) && (
        <Button
          onClick={clearAllFilters}
          variant="outline"
          className="border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50"
        >
          Clear all filters
        </Button>
      )}
    </div>
  );

  const totalPages = Math.ceil((data?.totalCount || 0) / pageSize);

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
            <Check className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "DEACTIVE":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-200">
            <Ban className="mr-1 h-3 w-3" />
            Deactivated
          </Badge>
        );
      default:
        return null;
    }
  };

  const getInitials = (name: string, lastName?: string) => {
    return `${name.charAt(0)}${lastName ? lastName.charAt(0) : ""}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-top-8 space-y-6 duration-700">
      <Card className="bg-white p-10">
        <div className="animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="mb-8 flex items-center space-x-4">
            <div className="w-fit rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500 p-4 shadow-lg">
              <User className="h-10 w-10 text-white" />
            </div>
            <h1 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-4xl font-bold text-[#0ca4d4] sm:text-5xl">
              User Management
            </h1>
          </div>

          <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 shadow-xl shadow-blue-500/5 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="border-b border-gray-100 bg-white/90 p-6 backdrop-blur-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative max-w-md flex-1">
                    <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search users by name, username..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="rounded-xl border-gray-200 bg-white py-3 pr-4 pl-12 text-base shadow-sm transition-all duration-200 focus:border-blue-400 focus:shadow-md focus:ring-4 focus:ring-blue-100"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setPage(1);
                        }}
                        className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="relative rounded-xl border-gray-200 text-gray-700 transition-all duration-200 hover:border-gray-300 hover:bg-gray-50"
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge className="ml-2 h-5 w-5 rounded-full bg-blue-500 p-0 text-xs text-white">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>

                    {activeFiltersCount > 0 && (
                      <Button
                        variant="ghost"
                        onClick={clearAllFilters}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                </div>

                {/* Collapsible Filters */}
                {showFilters && (
                  <div className="animate-in slide-in-from-top-5 mt-6 duration-300">
                    <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50/80 p-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          value={statusFilter}
                          onChange={(e) => {
                            setStatusFilter(
                              e.target.value as UserStatus | "ALL",
                            );
                            setPage(1);
                          }}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-all duration-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="PENDING">Pending</option>
                          <option value="APPROVED">Approved</option>
                          <option value="DEACTIVE">Deactivated</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Results Summary */}
              {data && (
                <div className="border-b border-gray-100 bg-blue-50/50 px-6 py-3"></div>
              )}

              {/* Table Section */}
              <div className="min-h-[400px]">
                {isLoading ? (
                  <TableSkeleton />
                ) : !data?.users.length ? (
                  <EmptyState />
                ) : (
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50/80">
                        <TableRow className="border-gray-100 hover:bg-gray-50/80">
                          <TableHead className="py-4 font-semibold text-gray-800">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              User Details
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-gray-800">
                            Username
                          </TableHead>
                          <TableHead className="font-semibold text-gray-800">
                            Contact
                          </TableHead>
                          <TableHead className="text-right font-semibold text-gray-800">
                            <div className="flex items-center justify-end gap-2">
                              Status
                              <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.users.map((user: any, index: number) => (
                          <TableRow
                            key={user.id}
                            className="animate-in slide-in-from-left-5 group border-gray-100 transition-all duration-200 hover:bg-blue-50/30"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TableCell className="py-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={user.image || undefined} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 font-medium text-blue-600">
                                    {getInitials(user.name, user.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-base font-semibold text-gray-900">
                                    {user.name} {user.middleName}{" "}
                                    {user.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {user.dateOfBirth?.toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-gray-700">
                                @{user.username}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-gray-600">
                                {user.contactNumber || "N/A"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.address || "No address"}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center justify-end gap-2">
                                <select
                                  value={user.status}
                                  onChange={(e) =>
                                    handleUpdateStatus(
                                      user.id,
                                      e.target.value as UserStatus,
                                    )
                                  }
                                  disabled={updateStatusMutation.isPending}
                                  className={`rounded-lg border p-1.5 text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-100 focus:outline-none ${
                                    updateStatusMutation.isPending
                                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                      : "cursor-pointer bg-white text-gray-700"
                                  } ${
                                    user.status === "APPROVED"
                                      ? "border-green-200 bg-green-50 text-green-700"
                                      : user.status === "PENDING"
                                        ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                                        : "border-red-200 bg-red-50 text-red-700"
                                  }`}
                                >
                                  <option value="PENDING">Pending</option>
                                  <option value="APPROVED">Approved</option>
                                  <option value="DEACTIVE">Deactivated</option>
                                </select>
                                {updateStatusMutation.isPending && (
                                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Enhanced Pagination */}
              {data && data.users.length > 0 && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>
                        Page{" "}
                        <span className="font-semibold text-gray-900">
                          {page}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-gray-900">
                          {totalPages}
                        </span>
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>{data.totalCount} total users</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                      </Button>

                      {/* Page numbers for desktop */}
                      <div className="hidden items-center gap-1 sm:flex">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const pageNum =
                              Math.max(1, Math.min(totalPages - 4, page - 2)) +
                              i;
                            if (pageNum > totalPages) return null;

                            return (
                              <Button
                                key={pageNum}
                                onClick={() => setPage(pageNum)}
                                variant={page === pageNum ? "default" : "ghost"}
                                size="sm"
                                className={`h-8 w-8 rounded-lg p-0 transition-all duration-200 ${
                                  page === pageNum
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          },
                        )}
                      </div>

                      <Button
                        onClick={() => setPage(page + 1)}
                        disabled={
                          !data?.users.length || data?.users.length < pageSize
                        }
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default UsersPage;
