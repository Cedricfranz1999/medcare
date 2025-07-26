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
} from "lucide-react";
import { Badge } from "~/components/ui/badge";

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
    <div className="animate-pulse space-y-4">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
          >
            <Skeleton className="h-6 w-48 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-16 rounded" />
              <Skeleton className="h-9 w-16 rounded" />
            </div>
          </div>
        ))}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 rounded-full bg-gray-100 p-4">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        No categories found
      </h3>
      <p className="mb-6 max-w-sm text-gray-500">
        {search
          ? "Try adjusting your search criteria"
          : "Get started by adding your first category"}
      </p>
      {!search && (
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#0ca4d4] text-white transition-all duration-200 hover:scale-105 hover:bg-[#0891b2]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Your First Category
        </Button>
      )}
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-top-8 container mx-auto space-y-6 p-6 duration-700">
      <Card className="min-h-[800px] rounded-xl border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-3xl font-bold text-[#0ca4d4]">
            <div className="rounded-lg bg-[#0ca4d4]/10 p-2">
              <Plus className="h-8 w-8 text-[#0ca4d4]" />
            </div>
            Medicine Categories
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search and Add Section */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:flex-row sm:items-center">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={handleSearch}
                className="border-gray-200 pl-10 transition-all duration-200 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]"
              />
            </div>

            <Button
              onClick={() => {
                setEditingCategory(null);
                setDialogOpen(true);
              }}
              className="bg-[#0ca4d4] text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-[#0891b2] hover:shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>

          {/* Table Section */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {isLoading ? (
              <TableSkeleton />
            ) : !data?.data.length ? (
              <EmptyState />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">
                      Name
                    </TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((category, index) => (
                    <TableRow
                      key={category.id}
                      className="animate-in slide-in-from-left-5 transition-all duration-200 hover:bg-gray-50/50"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-semibold text-gray-900">
                        {category.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(category)}
                            className="border-gray-300 transition-all duration-200 hover:border-[#0ca4d4] hover:bg-[#0ca4d4]/5 hover:text-[#0ca4d4]"
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
                                className="border-red-300 bg-transparent text-red-600 transition-all duration-200 hover:border-red-400 hover:bg-red-50"
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
                                  {category.name} This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-300 hover:bg-gray-50">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    setDeletingId(category.id);
                                    deleteMutation.mutate({ id: category.id });
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
            )}
          </div>

          {/* Pagination */}
          {data && data.data.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 p-4">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                variant="outline"
                className="border-gray-300 transition-all duration-200 hover:border-[#0ca4d4] hover:bg-[#0ca4d4]/5 hover:text-[#0ca4d4] disabled:opacity-50"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page{" "}
                  <span className="font-semibold text-gray-900">{page}</span> of{" "}
                  <span className="font-semibold text-gray-900">
                    {Math.ceil((data?.total || 0) / pageSize)}
                  </span>
                </span>
                <span className="text-xs text-gray-500">
                  ({data?.total || 0} total items)
                </span>
              </div>

              <Button
                onClick={() => setPage(page + 1)}
                disabled={!data?.data.length || data?.data.length < pageSize}
                variant="outline"
                className="border-gray-300 transition-all duration-200 hover:border-[#0ca4d4] hover:bg-[#0ca4d4]/5 hover:text-[#0ca4d4] disabled:opacity-50"
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
        <DialogContent className="animate-in fade-in-0 zoom-in-95 border-gray-200 bg-white duration-300">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingCategory?.id ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingCategory?.id
                ? "Update the category details below."
                : "Fill in the details of the new medicine category."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingCategory?.name}
                  className="border-gray-300 transition-all duration-200 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]"
                  required
                />
              </div>
            </div>
            <DialogFooter className="border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-gray-300 transition-all duration-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={upsertMutation.isPending}
                className="bg-[#0ca4d4] text-white transition-all duration-200 hover:scale-105 hover:bg-[#0891b2] disabled:hover:scale-100"
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
  );
};

export default MedicineCategoriesPage;
