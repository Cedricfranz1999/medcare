"use client";

import React, { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Loader2,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  MoreVertical,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

const MedicineCategoriesPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id?: number;
    name: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const pageSize = 10;

  const { data, refetch, isLoading } =
    api.medicineRouterCategory.getAll.useQuery({
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
    });

  const upsertMutation = api.medicineRouterCategory.createOrUpdate.useMutation({
    onSuccess: async () => {
      toast({
        title: "✅ Success!",
        description: "Category saved successfully",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      refetch();
      setDialogOpen(false);
      setEditingCategory(null);
    },
    onError: (error) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = api.medicineRouterCategory.delete.useMutation({
    onSuccess: async () => {
      toast({
        title: "🗑️ Deleted",
        description: "Category deleted successfully",
        variant: "default",
        className: "border-red-200 bg-red-50 text-red-800",
      });
      refetch();
      setDeletingId(null);
    },
    onError: () => {
      setDeletingId(null);
    },
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleEdit = (category: { id: number; name: string }) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const categoryData = {
      id: editingCategory?.id,
      name: formData.get("name") as string,
    };

    upsertMutation.mutate(categoryData);
  };

  const TableSkeleton = () => (
    <div className="space-y-3 p-4 sm:p-6">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-gray-100 p-3 sm:p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <Skeleton className="h-5 w-32 rounded sm:w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-14 rounded sm:w-16" />
              <Skeleton className="h-8 w-14 rounded sm:w-16" />
            </div>
          </div>
        ))}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-16">
      <div className="mb-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-6">
        <Grid3X3 className="h-12 w-12 text-[#0ca4d4]" />
      </div>
      <h3 className="mb-3 text-xl font-bold text-gray-900 sm:text-2xl">
        No categories found
      </h3>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-gray-500 sm:text-base">
        {search
          ? "Try adjusting your search criteria to find what you're looking for"
          : "Get started by creating your first medicine category to organize your inventory"}
      </p>
      {!search && (
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-gradient-to-r from-[#0ca4d4] to-[#0891b2] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Your First Category
        </Button>
      )}
    </div>
  );

  // Mobile Card Component
  const MobileCategoryCard = ({
    category,
    index,
  }: {
    category: { id: number; name: string };
    index: number;
  }) => (
    <Card
      className="mb-3 overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-md"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardContent className="bg- p-4">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0ca4d4] to-[#0891b2] font-semibold text-white">
              {category.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-gray-900">
                {category.name}
              </h3>
              <p className="text-xs text-gray-500">Medicine Category</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => handleEdit(category)}
                className="cursor-pointer text-[#0ca4d4] focus:text-[#0ca4d4]"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-900">
                      Delete Category
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-gray-600">
                      Are you sure you want to delete {category.name} This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
                    <AlertDialogCancel className="w-full sm:w-auto">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setDeletingId(category.id);
                        deleteMutation.mutate({ id: category.id });
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 sm:w-auto"
                    >
                      {deletingId === category.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Category"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <div className="space-y-4 sm:space-y-6">
        <Card className="min-h-[700px] border-0 bg-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
          <CardHeader className="px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gradient-to-br from-[#0ca4d4] to-[#0891b2] p-3 shadow-lg">
                  <Grid3X3 className="h-6 w-6 text-white sm:h-8 sm:w-8" />
                </div>
                <div>
                  <CardTitle className="bg-gradient-to-r from-[#0ca4d4] to-[#0891b2] bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                    <h1 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-4xl font-bold text-[#0ca4d4] sm:text-5xl">
                      Medicine Categories
                    </h1>{" "}
                  </CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    Organize your medicine inventory
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="border-[#0ca4d4]/20 bg-[#0ca4d4]/10 text-[#0ca4d4]"
                >
                  {data?.total || 0} Categories
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-4 pb-4 sm:space-y-6 sm:px-6 sm:pb-6">
            {/* Search and Add Section */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50/50 to-blue-50/30 p-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search categories..."
                  value={search}
                  onChange={handleSearch}
                  className="h-10 border-gray-200/50 bg-white/70 pl-10 backdrop-blur-sm transition-all duration-200 focus:border-[#0ca4d4] focus:bg-white focus:ring-[#0ca4d4]/20 sm:h-11"
                />
              </div>

              <Button
                onClick={() => {
                  setEditingCategory(null);
                  setDialogOpen(true);
                }}
                className="h-10 bg-gradient-to-r from-[#0ca4d4] to-[#0891b2] px-4 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 sm:h-11 sm:px-6"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Category</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>

            {/* Content Section */}
            <div className="overflow-hidden rounded-xl border border-gray-200/50 bg-white/50 shadow-sm backdrop-blur-sm">
              {isLoading ? (
                <TableSkeleton />
              ) : !data?.data.length ? (
                <EmptyState />
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="block p-4 lg:hidden">
                    {data.data.map((category, index) => (
                      <MobileCategoryCard
                        key={category.id}
                        category={category}
                        index={index}
                      />
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b bg-gradient-to-r from-gray-50 to-blue-50/50 hover:from-gray-100 hover:to-blue-50">
                          <TableHead className="h-12 font-semibold text-gray-700">
                            <div className="flex items-center gap-2">
                              <Grid3X3 className="h-4 w-4" />
                              Category Name
                            </div>
                          </TableHead>
                          <TableHead className="w-40 text-right font-semibold text-gray-700">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.data.map((category, index) => (
                          <TableRow
                            key={category.id}
                            className="group border-b border-gray-100/50 transition-all duration-200 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-blue-50/30"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0ca4d4] to-[#0891b2] font-semibold text-white shadow-md">
                                  {category.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 transition-colors duration-200 group-hover:text-[#0ca4d4]">
                                    {category.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Medicine Category
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(category)}
                                  className="border-gray-300 text-gray-700 shadow-sm transition-all duration-200 hover:border-[#0ca4d4] hover:bg-[#0ca4d4]/5 hover:text-[#0ca4d4] hover:shadow-md"
                                >
                                  <Edit className="mr-1 h-4 w-4" />
                                  Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={deletingId === category.id}
                                      className="border-red-300 text-red-600 shadow-sm transition-all duration-200 hover:border-red-400 hover:bg-red-50 hover:shadow-md"
                                    >
                                      {deletingId === category.id ? (
                                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="mr-1 h-4 w-4" />
                                      )}
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="border-gray-200 bg-white">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="text-gray-900">
                                        Delete Category
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-gray-600">
                                        Are you sure you want to delete
                                        {category.name} This action cannot be
                                        undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="border-gray-300 hover:bg-gray-50">
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          setDeletingId(category.id);
                                          deleteMutation.mutate({
                                            id: category.id,
                                          });
                                        }}
                                        className="bg-red-600 text-white transition-colors duration-200 hover:bg-red-700"
                                      >
                                        Delete Category
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>

            {/* Pagination */}
            {data && data.data.length > 0 && (
              <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/30 p-4 sm:flex-row">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  variant="outline"
                  className="w-full border-gray-300 shadow-sm transition-all duration-200 hover:border-[#0ca4d4] hover:bg-[#0ca4d4]/5 hover:text-[#0ca4d4] hover:shadow-md disabled:opacity-50 sm:w-auto"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>

                <div className="flex flex-col items-center gap-2 text-center sm:flex-row">
                  <span className="text-sm text-gray-600">
                    Page{" "}
                    <span className="font-semibold text-[#0ca4d4]">{page}</span>{" "}
                    of{" "}
                    <span className="font-semibold text-[#0ca4d4]">
                      {Math.ceil((data?.total || 0) / pageSize)}
                    </span>
                  </span>
                  <Badge
                    variant="secondary"
                    className="border-[#0ca4d4]/20 bg-[#0ca4d4]/10 text-xs text-[#0ca4d4]"
                  >
                    {data?.total || 0} total items
                  </Badge>
                </div>

                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={!data?.data.length || data?.data.length < pageSize}
                  variant="outline"
                  className="w-full border-gray-300 shadow-sm transition-all duration-200 hover:border-[#0ca4d4] hover:bg-[#0ca4d4]/5 hover:text-[#0ca4d4] hover:shadow-md disabled:opacity-50 sm:w-auto"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="mx-4 max-w-md border-gray-200 bg-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="bg-gradient-to-r from-[#0ca4d4] to-[#0891b2] bg-clip-text text-xl font-bold text-transparent">
                {editingCategory?.id ? "Edit Category" : "Add New Category"}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                {editingCategory?.id
                  ? "Update the category details below."
                  : "Fill in the details of the new medicine category."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Category Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingCategory?.name}
                    placeholder="Enter category name..."
                    className="h-11 border-gray-300 transition-all duration-200 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]/20"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="w-full border-gray-300 transition-all duration-200 hover:bg-gray-50 sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={upsertMutation.isPending}
                  className="w-full bg-gradient-to-r from-[#0ca4d4] to-[#0891b2] text-white transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 disabled:hover:scale-100 sm:w-auto"
                >
                  {upsertMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>{editingCategory?.id ? "Update" : "Create"} Category</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MedicineCategoriesPage;
