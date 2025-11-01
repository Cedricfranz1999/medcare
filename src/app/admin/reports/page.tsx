"use client";
import type React from "react";
import { useState, useRef } from "react";
import { useToast } from "~/components/ui/use-toast";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
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
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import {
  Download,
  CalendarIcon,
  Search,
  Plus,
  Package,
  AlertTriangle,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";

interface Medicine {
  id: number;
  name: string;
  brand: string;
  description: string | null;
  type: string;
  dosageForm: string;
  size: string | null;
  stock: number;
  recommended: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  expiryDate: Date | null;
}

interface MedicineRequest {
  id: number;
  reason: string;
  status: string;
  requestedAt: Date;
  approvedAt: Date | null;
  givenAt: Date | null;
  user: {
    name: string;
    username: string;
  };
  medicines: {
    id: number;
    quantity: number;
    medicine: Medicine;
  }[];
}

interface Category {
  id: number;
  name: string;
}

const PrintHeader = ({
  dateRange,
}: {
  dateRange: { from: Date | undefined; to: Date | undefined };
}) => {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <img src="/logo2.png" alt="MedCare Logo" className="h-12" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold">Medicine Inventory Report</h2>
        <p className="text-sm text-gray-600">
          {dateRange.from && dateRange.to
            ? `${format(dateRange.from, "MMMM dd, yyyy")} - ${format(dateRange.to, "MMMM dd, yyyy")}`
            : "All Dates"}
        </p>
      </div>
      <div>
        <img
          src="/logo1.png"
          alt="MedCare Logo"
          className="h-14 w-14 rounded-full object-cover"
        />
      </div>
    </div>
  );
};

const MedicineReportsPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null,
  );
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [expiryFilter, setExpiryFilter] = useState<
    "all" | "expired" | "expiring"
  >("all");

  const printRef = useRef<HTMLDivElement>(null);

  // Fixed print function - using contentRef instead of content
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Medicine Inventory Report",
    pageStyle: `
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          background-color: white !important;
        }
        .print-container * {
          background-color: white !important;
          color: black !important;
        }
        @page {
          margin: 0.5in;
        }
      }
    `,
    onAfterPrint: () => {
      toast({
        title: "✅ Print Complete",
        description: "Report printed successfully",
        variant: "default",
        style: {
          backgroundColor: "white",
        },
      });
    },
    onPrintError: () => {
      toast({
        title: "❌ Print Error",
        description: "Failed to print report",
        variant: "destructive",
        style: {
          backgroundColor: "white",
        },
      });
    },
  });

  // Fetch categories from database
  const { data: categoriesData, isLoading: categoriesLoading } =
    api.reporstData.getCategories.useQuery();

  const {
    data: medicinesData,
    refetch: refetchMedicines,
    isLoading: medicinesLoading,
  } = api.reporstData.getMedicines.useQuery({
    skip: (page - 1) * pageSize,
    take: pageSize,
    search,
    stockFilter,
    type: typeFilter,
    category: categoryFilter,
    expiryFilter,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  const { data: requestsData, refetch: refetchRequests } =
    api.reporstData.getRequests.useQuery({
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
    });

  const { data: chartData } = api.reporstData.getChartData.useQuery({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    stockFilter,
    type: typeFilter,
    category: categoryFilter,
    expiryFilter,
  });

  const requestMutation = api.reporstData.requestMedicine.useMutation({
    onSuccess: () => {
      toast({
        title: "✅ Success!",
        description: "Medicine request submitted successfully",
        variant: "default",
        style: {
          backgroundColor: "white",
        },
      });
      setRequestDialogOpen(false);
      setSelectedMedicine(null);
      refetchRequests();
    },
    onError: (error) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
        style: {
          backgroundColor: "white",
        },
      });
    },
  });

  const exportMedicinesMutation =
    api.reporstData.exportMedicinesCSV.useMutation({
      onSuccess: (data) => {
        const blob = new Blob([data.csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `medicine-inventory-${format(new Date(), "yyyy-MM-dd")}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast({
          title: "📊 Export Complete",
          description: "Medicine inventory CSV downloaded successfully",
          variant: "default",
          style: {
            backgroundColor: "white",
          },
        });
      },
    });

  const exportRequestsMutation = api.reporstData.exportRequestsCSV.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medicine-requests-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "📊 Export Complete",
        description: "Medicine requests CSV downloaded successfully",
        variant: "default",
        style: {
          backgroundColor: "white",
        },
      });
    },
  });

  const handleExportMedicinesCSV = () => {
    exportMedicinesMutation.mutate({
      search,
      stockFilter,
      type: typeFilter,
      category: categoryFilter,
      expiryFilter,
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
    });
  };

  const handleExportRequestsCSV = () => {
    exportRequestsMutation.mutate({
      dateFrom: dateRange.from,
      dateTo: dateRange.to,
    });
  };

  const handleRequestSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMedicine) return;
    const formData = new FormData(e.currentTarget);
    requestMutation.mutate({
      medicineId: selectedMedicine.id,
      quantity: Number.parseInt(formData.get("quantity") as string),
      reason: formData.get("reason") as string,
      userId: 1,
    });
  };

  const lowStockCount =
    medicinesData?.data.filter((m) => m.stock <= 10).length || 0;
  const outOfStockCount =
    medicinesData?.data.filter((m) => m.stock === 0).length || 0;

  const chartConfig = {
    stock: {
      label: "Stock Level",
      color: "#3b82f6",
    },
    requests: {
      label: "Requests",
      color: "#10b981",
    },
  };

  const pieColors = {
    OTC: "#3b82f6",
    PRESCRIPTION: "#ef4444",
  };

  return (
    <div className="min-h-screen bg-white bg-gradient-to-br">
      <div className="container mx-auto space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-4xl font-bold text-[#0ca4d4] sm:text-5xl">
              Medicine Reports
            </h1>
            <p className="text-gray-600">Inventory management and analytics</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handlePrint()}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
            <Button
              onClick={handleExportMedicinesCSV}
              disabled={exportMedicinesMutation.isPending}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              {exportMedicinesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export Medicines
            </Button>
            <Button
              onClick={handleExportRequestsCSV}
              disabled={exportRequestsMutation.isPending}
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
            >
              {exportRequestsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export Requests
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-lg border-none border-gray-300 shadow-md drop-shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Medicines
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {medicinesData?.total || 0}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-none border-gray-300 shadow-md drop-shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {lowStockCount}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-none border-gray-300 shadow-md drop-shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Out of Stock
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {outOfStockCount}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border-none border-gray-300 shadow-md drop-shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Requests
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {requestsData?.length || 0}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {chartData && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="rounded-lg border-none border-gray-300 bg-gray-50 shadow-md drop-shadow-md transition-colors duration-300 hover:bg-white">
              <CardHeader>
                <CardTitle>Stock Levels by Medicine</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.stockChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "#cbd5e1" }}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="stock"
                        fill={chartConfig.stock.color}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-none border-gray-300 shadow-md drop-shadow-md">
              <CardHeader>
                <CardTitle>Medicine Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.typeChart}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {chartData.typeChart.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              pieColors[entry.name as keyof typeof pieColors]
                            }
                          />
                        ))}
                      </Pie>
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="rounded-lg border-none border-gray-300 shadow-md drop-shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 border-gray-300 text-gray-400" />
                <Input
                  placeholder="Search medicines..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-md border-gray-300 pl-10 shadow-sm drop-shadow-sm"
                />
              </div>
              <Select
                value={stockFilter}
                onValueChange={(value: "all" | "low" | "out") =>
                  setStockFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="low">Low Stock (≤10)</SelectItem>
                  <SelectItem value="out">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="OTC">OTC</SelectItem>
                  <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent className="max-h-72 bg-white">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoriesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading categories...
                    </SelectItem>
                  ) : (
                    categoriesData?.map((category: Category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Select
                value={expiryFilter}
                onValueChange={(value: "all" | "expired" | "expiring") =>
                  setExpiryFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by expiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal sm:w-[280px]",
                      !dateRange.from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto bg-white p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) =>
                      setDateRange(
                        range || ({ from: undefined, to: undefined } as any),
                      )
                    }
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2 bg-white">
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="1000">display all</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {Math.ceil((medicinesData?.total || 0) / pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={
                page >= Math.ceil((medicinesData?.total || 0) / pageSize)
              }
            >
              Next
            </Button>
          </div>
        </div>

        {/* Print content - this is what will be printed */}
        <div style={{ display: "none" }}>
          <div ref={printRef} className="print-container bg-white p-6">
            <PrintHeader dateRange={dateRange} />
            <Card className="mb-6 rounded-lg border border-gray-300 shadow-md">
              <CardHeader>
                <CardTitle>Medicine Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                {medicinesLoading ? (
                  <div className="space-y-3">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-300">
                          <TableHead>Medicine</TableHead>
                          <TableHead>Brand</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Expiry</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {medicinesData?.data.map((medicine) => (
                          <TableRow
                            key={medicine.id}
                            className="border-gray-300"
                          >
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {medicine.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {medicine.dosageForm}{" "}
                                  {medicine.size && `- ${medicine.size}`}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{medicine.brand}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{medicine.type}</Badge>
                            </TableCell>
                            <TableCell>{medicine.category}</TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "font-medium",
                                  medicine.stock === 0
                                    ? "text-red-600"
                                    : medicine.stock <= 10
                                      ? "text-orange-600"
                                      : "text-green-600",
                                )}
                              >
                                {medicine.stock}
                              </span>
                            </TableCell>
                            <TableCell>
                              {medicine.expiryDate
                                ? format(
                                    new Date(medicine.expiryDate),
                                    "MMM dd, yyyy",
                                  )
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  medicine.stock === 0
                                    ? "destructive"
                                    : medicine.stock <= 10
                                      ? "secondary"
                                      : "default"
                                }
                              >
                                {medicine.stock === 0
                                  ? "Out of Stock"
                                  : medicine.stock <= 10
                                    ? "Low Stock"
                                    : "In Stock"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-lg border border-gray-300 shadow-md">
              <CardHeader>
                <CardTitle>All Medicine Requests</CardTitle>
              </CardHeader>
              <CardContent className="bg-red-500">
                <div className="space-y-4">
                  {requestsData?.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div>
                        <div className="font-medium">{request.user.name}</div>
                        <div className="text-sm text-gray-500">
                          {request.reason}
                        </div>
                        <div className="text-xs text-gray-400">
                          {format(
                            new Date(request.requestedAt),
                            "MMM dd, yyyy",
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            request.status === "GIVEN"
                              ? "default"
                              : request.status === "CANCELLED"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {request.status}
                        </Badge>
                        <div className="mt-1 text-sm text-gray-500">
                          {request.medicines.length} item(s)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Regular display content */}
        <Card className="max-h-[600px] overflow-scroll rounded-lg border-none border-gray-300 shadow-md drop-shadow-md">
          <CardHeader>
            <CardTitle>Medicine Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {medicinesLoading ? (
              <div className="space-y-3">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-300">
                      <TableHead>Medicine</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicinesData?.data.map((medicine) => (
                      <TableRow key={medicine.id} className="border-gray-300">
                        <TableCell>
                          <div>
                            <div className="font-medium">{medicine.name}</div>
                            <div className="text-sm text-gray-500">
                              {medicine.dosageForm}{" "}
                              {medicine.size && `- ${medicine.size}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{medicine.brand}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{medicine.type}</Badge>
                        </TableCell>
                        <TableCell>{medicine.category}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "font-medium",
                              medicine.stock === 0
                                ? "text-red-600"
                                : medicine.stock <= 10
                                  ? "text-orange-600"
                                  : "text-green-600",
                            )}
                          >
                            {medicine.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          {medicine.expiryDate
                            ? format(
                                new Date(medicine.expiryDate),
                                "MMM dd, yyyy",
                              )
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              medicine.stock === 0
                                ? "destructive"
                                : medicine.stock <= 10
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {medicine.stock === 0
                              ? "Out of Stock"
                              : medicine.stock <= 10
                                ? "Low Stock"
                                : "In Stock"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="max-h-[600px] overflow-scroll rounded-lg border-none border-gray-300 shadow-md drop-shadow-md">
          <CardHeader>
            <CardTitle>All Medicine Requests</CardTitle>
          </CardHeader>
          <CardContent className="">
            <div className="space-y-4">
              {requestsData?.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div>
                    <div className="font-medium">{request.user.name}</div>
                    <div className="text-sm text-gray-500">
                      {request.reason}
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(request.requestedAt), "MMM dd, yyyy")}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        request.status === "GIVEN"
                          ? "default"
                          : request.status === "CANCELLED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {request.status}
                    </Badge>
                    <div className="mt-1 text-sm text-gray-500">
                      {request.medicines.length} item(s)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Medicine</DialogTitle>
              <DialogDescription>
                Submit a request for {selectedMedicine?.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  max={selectedMedicine?.stock || 1}
                  required
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Please provide a reason for this request..."
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRequestDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={requestMutation.isPending}>
                  {requestMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
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

export default MedicineReportsPage;
