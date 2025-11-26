"use client";
import { api } from "~/trpc/react";
import { useToast } from "~/components/ui/use-toast";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Search,
  Calendar,
  User,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Edit,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

const statusConfig = {
  REQUESTED: {
    label: "Requested",
    color:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    icon: Clock,
  },
  GIVEN: {
    label: "Given",
    color:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
    icon: XCircle,
  },
  APPROVED: {
    label: "Approved",
    color:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    icon: CheckCircle,
  },
};

interface MedicineRequest {
  id: number;
  user: {
    name: string;
    username: string;
  };
  medicines: {
    medicine: {
      id: number;
      name: string;
      brand: string;
      image?: string | null;
      stock: number;
    };
    quantity: number;
  }[];
  reason: string;
  status: "REQUESTED" | "GIVEN" | "CANCELLED" | "APPROVED";
  requestedAt: Date;
}

export default function MedicineRequestsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [cancelReason, setCancelReason] = useState("");
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MedicineRequest | null>(null);
  const [editedQuantities, setEditedQuantities] = useState<{[key: number]: number}>({});
  const pageSize = 10;

  const { data, isLoading, refetch } = api.medicineReqeust.getAll.useQuery(
    {
      skip: (page - 1) * pageSize,
      take: pageSize,
      search,
      status:
        statusFilter === "all"
          ? undefined
          : (statusFilter as "REQUESTED" | "GIVEN" | "CANCELLED" | "APPROVED"),
    },
    {
      refetchInterval: 5000, 
      refetchOnWindowFocus: false, 
    }
  );

  const updateStatus = api.medicineReqeust.updateStatus.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Request status updated successfully",
      });
      refetch();
      setOpenCancelDialog(false);
      setCancelReason("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQuantities = api.medicineReqeust.updateQuantities.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Medicine quantities updated successfully",
      });
      refetch();
      setOpenEditDialog(false);
      setEditedQuantities({});
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (
    request: MedicineRequest,
    status: "GIVEN" | "CANCELLED" | "APPROVED",
  ) => {
    if (status === "CANCELLED") {
      setSelectedRequest(request);
      setOpenCancelDialog(true);
    } else {
      updateStatus.mutate({ id: request.id, status });
    }
  };

  const handleEditQuantities = (request: MedicineRequest) => {
    setSelectedRequest(request);
    const initialQuantities: {[key: number]: number} = {};
    request.medicines.forEach(item => {
      initialQuantities[item.medicine.id] = item.quantity;
    });
    setEditedQuantities(initialQuantities);
    setOpenEditDialog(true);
  };

  const handleQuantityChange = (medicineId: number, newQuantity: number) => {
    setEditedQuantities(prev => ({
      ...prev,
      [medicineId]: newQuantity
    }));
  };

  const saveQuantities = () => {
    if (selectedRequest) {
      updateQuantities.mutate({
        requestId: selectedRequest.id,
        quantities: editedQuantities
      });
    }
  };

  const confirmCancel = () => {
    if (selectedRequest && cancelReason.trim()) {
      updateStatus.mutate({
        id: selectedRequest.id,
        status: "CANCELLED",
        cancelledReason: cancelReason,
      });
    }
  };

  const getStatusCounts = () => {
    if (!data) return { all: 0, REQUESTED: 0, GIVEN: 0, CANCELLED: 0, APPROVED: 0 };
    const counts = data.requests.reduce(
      (acc, request) => {
        acc[request.status]++;
        acc.all++;
        return acc;
      },
      { all: 0, REQUESTED: 0, GIVEN: 0, CANCELLED: 0, APPROVED: 0 },
    );
    return counts;
  };

  const statusCounts = getStatusCounts();

  const MobileRequestCard = ({ request }: { request: MedicineRequest }) => {
    const StatusIcon = statusConfig[request.status].icon;
    return (
      <Card className="mb-4 overflow-hidden border shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                {request.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {request.user.name}
                </div>
                <div className="text-muted-foreground text-xs">
                  @{request.user.username}
                </div>
              </div>
            </div>
            <Badge
              className={`${statusConfig[request.status].color} shrink-0 border text-xs font-medium`}
            >
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig[request.status].label}
            </Badge>
          </div>
          <div className="mb-3">
            <div className="text-muted-foreground mb-2 flex items-center gap-1 text-xs font-medium">
              <Package className="h-3 w-3" />
              Medicines
            </div>
            <div className="space-y-2">
              {request.medicines.map((item) => (
                <div
                  key={item.medicine.id}
                  className="bg-muted/30 flex items-center gap-2 rounded-lg p-2"
                >
                  {item.medicine.image ? (
                    <Image
                      unoptimized
                      width={40}
                      height={40}
                      src={item.medicine.image || "/placeholder.svg"}
                      alt={item.medicine.name}
                      className="h-6 w-6 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br from-green-400 to-blue-500">
                      <Package className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium ">
                      {item.medicine.name}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {item.medicine.brand} • Qty: {item.quantity}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Stock: {item.medicine.stock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <div className="text-muted-foreground mb-1 text-xs font-medium">
              Reason
            </div>
            <p className="line-clamp-2 text-sm" title={request.reason}>
              {request.reason}
            </p>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <div className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">
                {new Date(request.requestedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hover:bg-muted h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white">
                {request.status === "REQUESTED" && (
                  <DropdownMenuItem
                    onClick={() => handleEditQuantities(request)}
                    className="text-blue-600 focus:text-blue-600"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Quantities
                  </DropdownMenuItem>
                )}
        
                {request.status !== "GIVEN" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(request, "GIVEN")}
                    className="text-emerald-600 focus:text-emerald-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Given
                  </DropdownMenuItem>
                )}
                {request.status !== "APPROVED" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(request, "APPROVED")}
                    className="text-blue-600 focus:text-blue-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Approved
                  </DropdownMenuItem>
                )}
                {request.status !== "CANCELLED" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(request, "CANCELLED")}
                    className="text-red-600 focus:text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Request
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="bg-background min-h-[800px] rounded-sm">
      <Card className="border-none bg-white p-4 sm:space-y-6 sm:p-6">
        <div className="space-y-4">
          <div>
            <h1 className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-4xl font-bold text-[#0ca4d4] sm:text-5xl">
              Medicine Request
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Manage and track medicine requests from users
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
            <Card className="border border-gray-300 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">Total</p>
                    <p className="truncate text-lg font-semibold sm:text-xl">
                      {data?.total || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-300 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-950">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">Pending</p>
                    <p className="truncate text-lg font-semibold sm:text-xl">
                      {statusCounts.REQUESTED}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-300 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-950">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">Given</p>
                    <p className="truncate text-lg font-semibold sm:text-xl">
                      {statusCounts.GIVEN}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-300 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-red-100 p-2 dark:bg-red-950">
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">Cancelled</p>
                    <p className="truncate text-lg font-semibold sm:text-xl">
                      {statusCounts.CANCELLED}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-300 shadow-sm transition-shadow duration-200 hover:shadow-md">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-950">
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">Approved</p>
                    <p className="truncate text-lg font-semibold sm:text-xl">
                      {statusCounts.APPROVED}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Card className="border border-gray-300 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="relative border-gray-300">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search by user, medicine, or brand..."
                  className="h-10 border-gray-300 pl-10"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="text-muted-foreground h-4 w-4 shrink-0" />
                <Tabs
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  className="flex-1"
                >
                  <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-5">
                    <TabsTrigger
                      value="all"
                      className="px-2 py-2 text-xs data-[state=active]:bg-blue-300 data-[state=active]:text-white"
                    >
                      <span className="block sm:hidden">All</span>
                      <span className="hidden sm:block">
                        All ({statusCounts.all})
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="REQUESTED"
                      className="px-2 py-2 text-xs data-[state=active]:bg-blue-300 data-[state=active]:text-white"
                    >
                      <span className="block sm:hidden">Pending</span>
                      <span className="hidden sm:block">
                        Pending ({statusCounts.REQUESTED})
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="GIVEN"
                      className="px-2 py-2 text-xs data-[state=active]:bg-blue-300 data-[state=active]:text-white"
                    >
                      <span className="block sm:hidden">Given</span>
                      <span className="hidden sm:block">
                        Given ({statusCounts.GIVEN})
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="CANCELLED"
                      className="px-2 py-2 text-xs data-[state=active]:bg-blue-300 data-[state=active]:text-white"
                    >
                      <span className="block sm:hidden">Cancelled</span>
                      <span className="hidden sm:block">
                        Cancelled ({statusCounts.CANCELLED})
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="APPROVED"
                      className="px-2 py-2 text-xs data-[state=active]:bg-blue-300 data-[state=active]:text-white"
                    >
                      <span className="block sm:hidden">Approved</span>
                      <span className="hidden sm:block">
                        Approved ({statusCounts.APPROVED})
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-300 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-4 p-4 sm:p-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-full max-w-[250px]" />
                      <Skeleton className="h-4 w-full max-w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-20 shrink-0" />
                  </div>
                ))}
              </div>
            ) : data?.requests.length ? (
              <>
                <div className="block p-4 lg:hidden">
                  {data.requests.map((request) => (
                    <MobileRequestCard key={request.id} request={request} />
                  ))}
                </div>
                <div className="hidden overflow-x-auto lg:block">
                  <Table className="border-gray-200">
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50 border-gray-200">
                        <TableHead className="font-semibold">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Requested By
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Medicines
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold">Reason</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date
                          </div>
                        </TableHead>
                        <TableHead className="w-16 font-semibold">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.requests.map((request) => {
                        const StatusIcon = statusConfig[request.status].icon;
                        return (
                          <TableRow
                            key={request.id}
                            className="hover:bg-muted/30 transition-colors duration-150  border   border-gray-300"
                          >
                            <TableCell className="min-w-[180px]">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                                  {request.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="truncate font-medium">
                                    {request.user.name}
                                  </div>
                                  <div className="text-muted-foreground truncate text-sm">
                                    @{request.user.username}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[250px]">
                              <div className="max-w-xs space-y-2">
                                {request.medicines.map((item) => (
                                  <div
                                    key={item.medicine.id}
                                    className="bg-muted/30 hover:bg-muted/50 flex items-center gap-3 rounded-lg p-2 transition-colors duration-150"
                                  >
                                    {item.medicine.image ? (
                                      <Image
                                        unoptimized
                                        width={40}
                                        height={40}
                                        src={
                                          item.medicine.image ||
                                          "/placeholder.svg"
                                        }
                                        alt={item.medicine.name}
                                        className="h-8 w-8 shrink-0 rounded-md object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-green-400 to-blue-500">
                                        <Package className="h-4 w-4 text-white" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-sm font-medium">
                                        {item.medicine.name}
                                      </div>
                                      <div className="text-muted-foreground truncate text-xs">
                                        {item.medicine.brand} • Qty:{" "}
                                        {item.quantity}
                                      </div>
                                      <div className="text-muted-foreground truncate text-xs">
                                        Stock: {item.medicine.stock}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <p
                                className="line-clamp-2 text-sm"
                                title={request.reason}
                              >
                                {request.reason}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${statusConfig[request.status].color} border font-medium`}
                              >
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusConfig[request.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell className="min-w-[120px]">
                              <div className="text-sm">
                                {new Date(
                                  request.requestedAt,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                              <div className="text-muted-foreground text-xs">
                                {new Date(
                                  request.requestedAt,
                                ).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="hover:bg-muted h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48 bg-white"
                                >
                                  {request.status === "REQUESTED" && (
                                    <DropdownMenuItem
                                      onClick={() => handleEditQuantities(request)}
                                      className="text-blue-600 focus:text-blue-600"
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Quantities
                                    </DropdownMenuItem>
                                  )}
                                  {request.status !== "GIVEN" && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(request, "GIVEN")}
                                      className="text-emerald-600 focus:text-emerald-600"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Mark as Given
                                    </DropdownMenuItem>
                                  )}
                                  {request.status !== "APPROVED" && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(request, "APPROVED")}
                                      className="text-blue-600 focus:text-blue-600"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Mark as Approved
                                    </DropdownMenuItem>
                                  )}
                                  {request.status !== "CANCELLED" && (
                                    <DropdownMenuItem
                                      onClick={() => handleStatusChange(request, "CANCELLED")}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Cancel Request
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-col items-center justify-between gap-4 border-t p-4 sm:flex-row sm:p-6">
                  <div className="text-muted-foreground text-center text-sm sm:text-left">
                    Showing {(page - 1) * pageSize + 1} to{" "}
                    {Math.min(page * pageSize, data.total)} of {data.total}{" "}
                    requests
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="h-8"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        {
                          length: Math.min(5, Math.ceil(data.total / pageSize)),
                        },
                        (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "outline"}
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        },
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        !data.requests.length || data.requests.length < pageSize
                      }
                      onClick={() => setPage(page + 1)}
                      className="h-8"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="px-4 py-16 text-center">
                <div className="mx-auto max-w-md">
                  <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                    <Package className="text-muted-foreground h-8 w-8" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">
                    No requests found
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {search || statusFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "No medicine requests have been submitted yet"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Quantities Dialog */}
        <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogContent className="mx-4 max-w-md bg-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Edit Medicine Quantities
              </DialogTitle>
              <DialogDescription className="text-sm">
                Adjust the quantities for each medicine in this request. Stock levels are shown for reference.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 space-y-4 overflow-y-auto py-4">
              {selectedRequest?.medicines.map((item) => (
                <div
                  key={item.medicine.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    {item.medicine.image ? (
                      <Image
                        unoptimized
                        width={40}
                        height={40}
                        src={item.medicine.image || "/placeholder.svg"}
                        alt={item.medicine.name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-green-400 to-blue-500">
                        <Package className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{item.medicine.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {item.medicine.brand} • Stock: {item.medicine.stock}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      max={item.medicine.stock}
                      value={editedQuantities[item.medicine.id] || item.quantity}
                      onChange={(e) => 
                        handleQuantityChange(item.medicine.id, parseInt(e.target.value) || 1)
                      }
                      className="w-20 text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setOpenEditDialog(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={saveQuantities}
                disabled={updateQuantities.isPending}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
              >
                {updateQuantities.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel Request Dialog */}
        <AlertDialog open={openCancelDialog} onOpenChange={setOpenCancelDialog}>
          <AlertDialogContent className="mx-4 max-w-md bg-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Cancel Request
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Please provide a reason for cancelling this medicine request.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                className="h-10 w-full"
              />
            </div>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
              <AlertDialogCancel
                onClick={() => setCancelReason("")}
                className="w-full sm:w-auto"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCancel}
                disabled={!cancelReason.trim() || updateStatus.isPending}
                className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
              >
                {updateStatus.isPending ? "Cancelling..." : "Confirm Cancel"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}