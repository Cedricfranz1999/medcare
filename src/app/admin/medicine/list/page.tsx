"use client";

import type React from "react";
import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import Image from "next/image";
import { Badge } from "~/components/ui/badge";
import { uploadImage } from "~/lib/upload/uploadImage";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Upload,
  Package,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

const MedicinesPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageSize = 10;

  const { data, refetch, isLoading } = api.medicine.getAll.useQuery({
    skip: (page - 1) * pageSize,
    take: pageSize,
    search,
    categoryId: categoryFilter,
  });

  const categories = api.medicine.getCategories.useQuery();

  const [editingMedicine, setEditingMedicine] = useState<{
    id?: number;
    name: string;
    brand: string;
    description?: string;
    type: "OTC" | "PRESCRIPTION";
    dosageForm:
      | "TABLET"
      | "SYRUP"
      | "CAPSULE"
      | "INJECTION"
      | "CREAM"
      | "DROPS";
    size?: string;
    expiryDate?: string;
    stock: number;
    categoryIds?: number[];
    image?: string;
  } | null>(null);

  const upsertMutation = api.medicine.createOrUpdate.useMutation({
    onSuccess: async () => {
      toast({
        title: "✅ Success!",
        description: "Medicine saved successfully",
        variant: "default",
        className: "border-green-200 bg-green-50 text-green-800",
      });
      refetch();
      setDialogOpen(false);
      setEditingMedicine(null);
      setImagePreview(null);
      setImageFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = api.medicine.delete.useMutation({
    onSuccess: async () => {
      toast({
        title: "🗑️ Deleted",
        description: "Medicine deleted successfully",
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

  const handleEdit = (medicine: any) => {
    setEditingMedicine({
      id: medicine.id,
      name: medicine.name,
      brand: medicine.brand,
      description: medicine.description || "",
      type: medicine.type,
      dosageForm: medicine.dosageForm,
      size: medicine.size || "",
      expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate).toISOString().split('T')[0] : "",
      stock: medicine.stock,
      categoryIds: medicine.categories?.map((c: any) => c.categoryId) || [],
      image: medicine.image || undefined,
    });
    if (medicine.image) {
      setImagePreview(medicine.image ?? null);
    }
    setDialogOpen(true);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, GIF, or WEBP)",
          variant: "destructive",
        });
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    let imageUrl = editingMedicine?.image;

    if (imageFile) {
      try {
        imageUrl = await uploadImage(imageFile);
      } catch (error) {
        toast({
          title: "Error uploading image",
          description: "Failed to upload the image",
          variant: "destructive",
        });
        return;
      }
    }

    // Get expiry date from form and handle properly
    const expiryDateValue = formData.get("expiryDate") as string;
    const expiryDate = expiryDateValue ? new Date(expiryDateValue) : undefined;

    const medicineData = {
      id: editingMedicine?.id,
      name: formData.get("name") as string,
      brand: formData.get("brand") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as "OTC" | "PRESCRIPTION",
      dosageForm: formData.get("dosageForm") as
        | "TABLET"
        | "SYRUP"
        | "CAPSULE"
        | "INJECTION"
        | "CREAM"
        | "DROPS",
      size: formData.get("size") as string,
      stock: Number(formData.get("stock")),
      expiryDate: expiryDate,
      categoryIds: editingMedicine?.categoryIds,
      image: imageUrl,
    };

    upsertMutation.mutate(medicineData);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteMutation.mutate({ id });
  };

  const TableSkeleton = () => (
    <div className="animate-pulse space-y-3 rounded-md bg-gray-300 p-4">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <div className="ml-auto flex gap-2">
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          </div>
        ))}
    </div>
  );

  const EmptyState = () => (
    <div className="animate-in fade-in-50 flex flex-col items-center justify-center py-16 text-center duration-500">
      <div className="mb-4 rounded-full bg-gray-100 p-6">
        <Package className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        No medicines found
      </h3>
      <p className="mb-6 max-w-sm text-gray-500">
        {search || categoryFilter
          ? "Try adjusting your search or filter criteria"
          : "Get started by adding your first medicine to the inventory"}
      </p>
      {!search && !categoryFilter && (
        <Button
          onClick={() => {
            setEditingMedicine({
              name: "",
              brand: "",
              type: "OTC",
              dosageForm: "TABLET",
              stock: 0,
              categoryIds: [],
              expiryDate: "",
            });
            setDialogOpen(true);
          }}
          className="bg-[#0ca4d4] text-white transition-all duration-200 hover:scale-105 hover:bg-[#0891b2]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Your First Medicine
        </Button>
      )}
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-top-8 bg-r rounded-md duration-700">
      <Card className="min-h-[800px] rounded-md border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-3xl font-bold text-[#0ca4d4]">
            <div className="rounded-lg bg-[#0ca4d4]/10 p-2">
              <Package className="h-8 w-8 text-[#0ca4d4]" />
            </div>
            <h1 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-4xl font-bold text-[#0ca4d4] sm:text-5xl">
              Medicine Stock
            </h1>{" "}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search and Filter Section */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:flex-row sm:items-center">
            <div className="flex flex-1 flex-col gap-4 sm:flex-row">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search medicines..."
                  value={search}
                  onChange={handleSearch}
                  className="border-gray-200 pl-10 transition-all duration-200 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]"
                />
              </div>

              <div className="relative">
                <Filter className="absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Select
                  value={categoryFilter ? categoryFilter.toString() : "all"}
                  onValueChange={(value) => {
                    setCategoryFilter(
                      value === "all" ? undefined : Number(value),
                    );
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px] border-gray-200 pl-10 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200 bg-white">
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.data?.map((category: any) => (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                        className="hover:bg-[#0ca4d4]/10"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={() => {
                setEditingMedicine({
                  name: "",
                  brand: "",
                  type: "OTC",
                  dosageForm: "TABLET",
                  stock: 0,
                  categoryIds: [],
                  expiryDate: "",
                });
                setDialogOpen(true);
              }}
              className="bg-[#0ca4d4] text-white shadow-md transition-all duration-200 hover:scale-105 hover:bg-[#0891b2] hover:shadow-lg"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Medicine
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
                  <TableRow className="border-gray-300 bg-gray-50/80 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">
                      Image
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Name
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Brand
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Type
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Form
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Stock
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Expiry Date
                    </TableHead>

                    <TableHead className="font-semibold text-gray-700">
                      Categories
                    </TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.map((medicine: any, index: any) => (
                    <TableRow
                      key={medicine.id}
                      className="animate-in slide-in-from-left-5 border-gray-300 transition-all duration-200 hover:bg-gray-50/50"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="group relative">
                          {medicine.image ? (
                            <Image 
                            unoptimized
                              src={medicine.image || "/placeholder.svg"}
                              alt={medicine.name}
                              width={48}
                              height={48}
                              className="h-12 w-12 rounded-lg border-2 border-gray-100 object-cover transition-all duration-200 group-hover:border-[#0ca4d4]"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 transition-all duration-200 group-hover:bg-gray-200">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-gray-900">
                        {medicine.name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {medicine.brand}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            medicine.type === "PRESCRIPTION"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            medicine.type === "PRESCRIPTION"
                              ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }
                        >
                          {medicine.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {medicine.dosageForm}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${
                            medicine.stock < 10
                              ? "text-red-600"
                              : medicine.stock < 50
                                ? "text-orange-600"
                                : "text-green-600"
                          }`}
                        >
                          {medicine.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        {medicine.expiryDate ? (
                          <span
                            className={
                              new Date(medicine.expiryDate) < new Date()
                                ? "font-semibold text-red-600"
                                : ""
                            }
                          >
                            {new Date(medicine.expiryDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {medicine.categories?.map(({ category }: any) => (
                            <Badge
                              key={category.id}
                              variant="outline"
                              className="border-[#0ca4d4]/30 text-[#0ca4d4] transition-colors duration-200 hover:bg-[#0ca4d4]/10"
                            >
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(medicine)}
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
                                disabled={deletingId === medicine.id}
                                className="border-red-300 bg-transparent text-red-600 transition-all duration-200 hover:border-red-400 hover:bg-red-50"
                              >
                                {deletingId === medicine.id ? (
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
                                  Delete Medicine
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-600">
                                  Are you sure you want to delete
                                  {medicine.name} This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gray-300 hover:bg-gray-50">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(medicine.id)}
                                  className="bg-red-600 text-white transition-colors duration-200 hover:bg-red-700"
                                >
                                  Delete Medicine
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
          {data && (
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
        <DialogContent className="animate-in fade-in-0 zoom-in-95 border-gray-200 bg-white duration-300 sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {editingMedicine?.id ? "Edit Medicine" : "Add New Medicine"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Fill in the details of the medicine. All required fields are
              marked with an asterisk.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
              {/* Image Upload Section */}
              <div className="flex items-start gap-6 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="group relative">
                    {imagePreview ? (
                      <Image
                      unoptimized
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        width={120}
                        height={120}
                        className="h-30 w-30 rounded-lg border-2 border-gray-200 object-cover transition-all duration-200 group-hover:border-[#0ca4d4]"
                      />
                    ) : (
                      <div className="flex h-30 w-30 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 transition-all duration-200 group-hover:border-[#0ca4d4]">
                        <div className="text-center">
                          <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            No image
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTriggerFileInput}
                    className="border-gray-300 bg-transparent transition-all duration-200 hover:border-[#0ca4d4] hover:bg-[#0ca4d4]/5 hover:text-[#0ca4d4]"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {imagePreview ? "Change" : "Upload"} Image
                  </Button>
                </div>

                {/* Basic Info */}
                <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
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
                      defaultValue={editingMedicine?.name}
                      className="border-gray-300 transition-all duration-200 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="brand"
                      className="text-sm font-medium text-gray-700"
                    >
                      Brand <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="brand"
                      name="brand"
                      defaultValue={editingMedicine?.brand}
                      className="border-gray-300 transition-all duration-200 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="type"
                      className="text-sm font-medium text-gray-700"
                    >
                      Medicine Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      name="type"
                      defaultValue={editingMedicine?.type || "OTC"}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="border-gray-200 bg-white">
                        <SelectItem
                          value="OTC"
                          className="hover:bg-[#0ca4d4]/10"
                        >
                          Over-the-counter (OTC)
                        </SelectItem>
                        <SelectItem
                          value="PRESCRIPTION"
                          className="hover:bg-[#0ca4d4]/10"
                        >
                          Prescription
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="dosageForm"
                      className="text-sm font-medium text-gray-700"
                    >
                      Dosage Form <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      name="dosageForm"
                      defaultValue={editingMedicine?.dosageForm || "TABLET"}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]">
                        <SelectValue placeholder="Select form" />
                      </SelectTrigger>
                      <SelectContent className="border-gray-200 bg-white">
                        <SelectItem
                          value="TABLET"
                          className="hover:bg-[#0ca4d4]/10"
                        >
                          Tablet
                        </SelectItem>
                        <SelectItem
                          value="SYRUP"
                          className="hover:bg-[#0ca4d4]/10"
                        >
                          Syrup
                        </SelectItem>
                        <SelectItem
                          value="CAPSULE"
                          className="hover:bg-[#0ca4d4]/10"
                        >
                          Capsule
                        </SelectItem>
                        <SelectItem
                          value="INJECTION"
                          className="hover:bg-[#0ca4d4]/10"
                        >
                          Injection
                        </SelectItem>
                        <SelectItem
                          value="CREAM"
                          className="hover:bg-[#0ca4d4]/10"
                        >
                          Cream
                        </SelectItem>
                        <SelectItem
                          value="DROPS"
                          className="hover:bg-[#0ca4d4]/10"
                        >
                          Drops
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="size"
                    className="text-sm font-medium text-gray-700"
                  >
                    Size
                  </Label>
                  <Input
                    id="size"
                    name="size"
                    placeholder="e.g., 500mg, 100ml"
                    defaultValue={editingMedicine?.size}
                    className="border-gray-300 transition-all duration-200 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="stock"
                    className="text-sm font-medium text-gray-700"
                  >
                    Stock <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    defaultValue={editingMedicine?.stock}
                    className="border-gray-300 transition-all duration-200 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label
                  htmlFor="expiryDate"
                  className="text-sm font-medium text-gray-700"
                >
                  Expiry Date
                </Label>
                <Input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  defaultValue={editingMedicine?.expiryDate || ""}
                  className="border-gray-300 transition-all duration-200 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]"
                />
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  Categories
                </Label>
                <div className="grid max-h-40 grid-cols-2 gap-3 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/50 p-4 sm:grid-cols-3">
                  {categories.data?.map((category: any) => (
                    <div
                      key={category.id}
                      className="flex items-center space-x-2 rounded p-2 transition-colors duration-200 hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        id={`category-${category.id}`}
                        checked={
                          editingMedicine?.categoryIds?.includes(category.id) ||
                          false
                        }
                        onChange={(e) => {
                          const newCategoryIds = e.target.checked
                            ? [
                                ...(editingMedicine?.categoryIds || []),
                                category.id,
                              ]
                            : editingMedicine?.categoryIds?.filter(
                                (id) => id !== category.id,
                              ) || [];
                          setEditingMedicine({
                            ...editingMedicine!,
                            categoryIds: newCategoryIds,
                          });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-[#0ca4d4] transition-colors duration-200 focus:ring-[#0ca4d4]"
                      />
                      <Label
                        htmlFor={`category-${category.id}`}
                        className="cursor-pointer text-sm font-medium text-gray-700"
                      >
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-sm font-medium text-gray-700"
                >
                  Description
                </Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Optional description or notes"
                  defaultValue={editingMedicine?.description}
                  className="border-gray-300 transition-all duration-200 focus:border-[#0ca4d4] focus:ring-[#0ca4d4]"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-gray-100 pt-6">
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
                  <>{editingMedicine?.id ? "Update" : "Create"} Medicine</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicinesPage;