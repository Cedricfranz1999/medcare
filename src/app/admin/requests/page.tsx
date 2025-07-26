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
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

const statusConfig = {
  REQUESTED: {
    label: "Requested",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Clock,
  },
  GIVEN: {
    label: "Given",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
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
    };
    quantity: number;
  }[];
  reason: string;
  status: "REQUESTED" | "GIVEN" | "CANCELLED";
  requestedAt: Date;
}

export default function MedicineRequestsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [cancelReason, setCancelReason] = useState("");
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<MedicineRequest | null>(null);

  const pageSize = 10;

  const { data, isLoading, refetch } = api.medicineReqeust.getAll.useQuery({
    skip: (page - 1) * pageSize,
    take: pageSize,
    search,
    status:
      statusFilter === "all"
        ? undefined
        : (statusFilter as "REQUESTED" | "GIVEN" | "CANCELLED"),
  });

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

  const handleStatusChange = (
    request: MedicineRequest,
    status: "GIVEN" | "CANCELLED",
  ) => {
    if (status === "CANCELLED") {
      setSelectedRequest(request);
      setOpenCancelDialog(true);
    } else {
      updateStatus.mutate({ id: request.id, status });
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
    if (!data) return { all: 0, REQUESTED: 0, GIVEN: 0, CANCELLED: 0 };

    const counts = data.requests.reduce(
      (acc, request) => {
        acc[request.status]++;
        acc.all++;
        return acc;
      },
      { all: 0, REQUESTED: 0, GIVEN: 0, CANCELLED: 0 },
    );

    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-[800px] rounded-lg bg-white">
      <div className="container mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Medicine Requests
            </h1>
            <p className="text-muted-foreground">
              Manage and track medicine requests from users
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="b-red-300 border p-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="text-lg font-semibold">{data?.total || 0}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-muted-foreground text-xs">Pending</p>
                  <p className="text-lg font-semibold">
                    {statusCounts.REQUESTED}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-muted-foreground text-xs">Given</p>
                  <p className="text-lg font-semibold">{statusCounts.GIVEN}</p>
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-muted-foreground text-xs">Cancelled</p>
                  <p className="text-lg font-semibold">
                    {statusCounts.CANCELLED}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search */}
              <div className="relative max-w-md flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search by user, medicine, or brand..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Status Filter Tabs */}
              <Tabs
                value={statusFilter}
                onValueChange={setStatusFilter}
                className="w-auto"
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all" className="text-xs">
                    All ({statusCounts.all})
                  </TabsTrigger>
                  <TabsTrigger value="REQUESTED" className="text-xs">
                    Pending ({statusCounts.REQUESTED})
                  </TabsTrigger>
                  <TabsTrigger value="GIVEN" className="text-xs">
                    Given ({statusCounts.GIVEN})
                  </TabsTrigger>
                  <TabsTrigger value="CANCELLED" className="text-xs">
                    Cancelled ({statusCounts.CANCELLED})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-4 p-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : data?.requests.length ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
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
                        <TableHead className="font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.requests.map((request) => {
                        const StatusIcon = statusConfig[request.status].icon;
                        return (
                          <TableRow
                            key={request.id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                                  {request.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {request.user.name}
                                  </div>
                                  <div className="text-muted-foreground text-sm">
                                    @{request.user.username}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs space-y-2">
                                {request.medicines.map((item) => (
                                  <div
                                    key={item.medicine.id}
                                    className="bg-muted/30 flex items-center gap-3 rounded-lg p-2"
                                  >
                                    {item.medicine.image ? (
                                      <img
                                        src={
                                          item.medicine.image ||
                                          "/placeholder.svg"
                                        }
                                        alt={item.medicine.name}
                                        className="h-8 w-8 rounded-md object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-green-400 to-blue-500">
                                        <Package className="h-4 w-4 text-white" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-sm font-medium">
                                        {item.medicine.name}
                                      </div>
                                      <div className="text-muted-foreground text-xs">
                                        {item.medicine.brand} • Qty:{" "}
                                        {item.quantity}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[200px]">
                                <p
                                  className="line-clamp-2 text-sm"
                                  title={request.reason}
                                >
                                  {request.reason}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`${statusConfig[request.status].color} border font-medium`}
                              >
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusConfig[request.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
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
                                  {request.status !== "GIVEN" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(request, "GIVEN")
                                      }
                                      className="text-emerald-600 focus:text-emerald-600"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Mark as Given
                                    </DropdownMenuItem>
                                  )}
                                  {request.status !== "CANCELLED" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusChange(request, "CANCELLED")
                                      }
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

                {/* Pagination */}
                <div className="flex items-center justify-between border-t p-6">
                  <div className="text-muted-foreground text-sm">
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
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-16 text-center">
                <Package className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">
                  No requests found
                </h3>
                <p className="text-muted-foreground">
                  {search || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No medicine requests have been submitted yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancel Dialog */}
        <AlertDialog open={openCancelDialog} onOpenChange={setOpenCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                Cancel Request
              </AlertDialogTitle>
              <AlertDialogDescription>
                Please provide a reason for cancelling this medicine request.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                className="w-full"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCancelReason("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmCancel}
                disabled={!cancelReason.trim() || updateStatus.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {updateStatus.isPending ? "Cancelling..." : "Confirm Cancel"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
